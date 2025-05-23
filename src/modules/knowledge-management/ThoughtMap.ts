// src/modules/knowledge-management/ThoughtMap.ts
import { App, TFile, normalizePath, HeadingCache, LinkCache, SectionCache, parseLinktext } from 'obsidian';

interface MermaidNode {
    id: string;
    displayText: string;
}

interface MermaidLink {
    sourceId: string;
    targetId: string;
    // Optional: label?: string;
}

/**
 * Generates a Mermaid graph definition string for a knowledge map (thought map)
 * centered on the currentNotePath, showing its immediate linked neighbors (1-degree connections).
 *
 * @param app - Obsidian's App object.
 * @param currentNotePath - The path of the note to center the map on.
 * @param depth - How many degrees of separation to explore (currently only depth 1 is implemented).
 * @returns A promise that resolves to a Mermaid graph string or null if the note is not found.
 */
export async function generateThoughtMapMermaid(
    app: App,
    currentNotePath: string,
    depth: number = 1 // Depth parameter is present but only depth 1 is implemented
): Promise<string | null> {
    const centralFile = app.vault.getAbstractFileByPath(currentNotePath);
    if (!(centralFile instanceof TFile)) {
        console.warn(`ThoughtMap: Central note not found at path: ${currentNotePath}`);
        return null;
    }

    const nodes: Map<string, MermaidNode> = new Map();
    const links: MermaidLink[] = [];

    // Function to add a node, ensuring unique IDs and consistent display text
    // Uses normalized path as ID to handle potential filename conflicts across folders
    const addNode = (filePath: string): MermaidNode => {
        const normalizedFilePath = normalizePath(filePath);
        if (!nodes.has(normalizedFilePath)) {
            const file = app.vault.getAbstractFileByPath(filePath);
            let displayText = filePath; // Fallback to path
            if (file instanceof TFile) {
                // Try to get a more friendly name, e.g., from frontmatter title or just basename
                const fileCache = app.metadataCache.getFileCache(file);
                displayText = fileCache?.frontmatter?.title || file.basename;
            } else { // If it's a path to a note that doesn't exist (broken link)
                 displayText = parseLinktext(filePath).path; // Get the path part without subpath/alias
            }
            // Sanitize displayText for Mermaid ID and string representation
            const sanitizedId = normalizedFilePath.replace(/[^\w\s-/.]/gi, '_').replace(/\s+/g, '_');
            const sanitizedDisplayText = displayText.replace(/"/g, '#quot;'); // Escape quotes for Mermaid label
            
            nodes.set(normalizedFilePath, { id: sanitizedId, displayText: sanitizedDisplayText });
        }
        return nodes.get(normalizedFilePath)!;
    };

    const centralNode = addNode(centralFile.path);
    let mermaidString = 'graph TD;\n'; // Top-Down graph

    // --- Process Outgoing Links (Depth 1) ---
    const centralCache = app.metadataCache.getCache(centralFile.path);
    if (centralCache?.links) {
        for (const link of centralCache.links) {
            const linkedFilePath = app.metadataCache.getFirstLinkpathDest(link.link, centralFile.path);
            if (linkedFilePath) {
                const targetNode = addNode(linkedFilePath.path);
                links.push({ sourceId: centralNode.id, targetId: targetNode.id });
            } else { // Unresolved link
                const targetNode = addNode(link.link); // Add node with the link text itself
                links.push({ sourceId: centralNode.id, targetId: targetNode.id });
            }
        }
    }

    // --- Process Incoming Links (Depth 1) ---
    // This can be performance-intensive on large vaults if not careful.
    // app.metadataCache.resolvedLinks gives all links, we need to filter.
    for (const sourcePath in app.metadataCache.resolvedLinks) {
        if (sourcePath === centralFile.path) continue; // Already handled outgoing

        const linkedNotes = app.metadataCache.resolvedLinks[sourcePath];
        for (const destPath in linkedNotes) {
            if (normalizePath(destPath) === normalizePath(centralFile.path)) {
                const sourceNode = addNode(sourcePath);
                // Check if this link is already covered by an outgoing link (e.g. A -> B and B -> A)
                // This check is basic and might not cover all edge cases of link directionality
                // if (!links.some(l => l.sourceId === centralNode.id && l.targetId === sourceNode.id)) {
                    links.push({ sourceId: sourceNode.id, targetId: centralNode.id });
                // }
                break; // Found one link from this source to central, move to next source
            }
        }
    }
    
    // --- Process Unresolved Incoming Links (Backlinks) ---
    // This is more complex as Obsidian doesn't directly expose "unresolved incoming links" easily.
    // A full scan would be needed: iterate all notes, parse their content for links pointing to `currentNotePath`.
    // For simplicity and performance, this part is omitted for now but important for a complete map.
    // The `app.metadataCache.getBacklinksForFile(centralFile)` can be useful here.

    const backlinks = app.metadataCache.getBacklinksForFile(centralFile);
    for (const sourcePath in backlinks.data) {
        if (normalizePath(sourcePath) === normalizePath(centralFile.path)) continue;

        const sourceNode = addNode(sourcePath);
         // Avoid duplicate links if A->B and B->A and both are processed
        const linkExists = links.some(l => 
            (l.sourceId === sourceNode.id && l.targetId === centralNode.id) ||
            (l.sourceId === centralNode.id && l.targetId === sourceNode.id) // For bidirectional links
        );
        if(!linkExists){
            links.push({ sourceId: sourceNode.id, targetId: centralNode.id });
        }
    }


    // --- Build Mermaid String ---
    // Add central node definition separately to style it differently if desired
    mermaidString += `    ${centralNode.id}["${centralNode.displayText}"];\n`;
    mermaidString += `    style ${centralNode.id} fill:#f9f,stroke:#333,stroke-width:2px;\n`;


    const uniqueNodeIds = new Set<string>();
    uniqueNodeIds.add(centralNode.id);

    for (const link of links) {
        const sourceNodeInfo = Array.from(nodes.values()).find(n => n.id === link.sourceId);
        const targetNodeInfo = Array.from(nodes.values()).find(n => n.id === link.targetId);

        if (sourceNodeInfo && targetNodeInfo) {
             if (!uniqueNodeIds.has(sourceNodeInfo.id)) {
                mermaidString += `    ${sourceNodeInfo.id}["${sourceNodeInfo.displayText}"];\n`;
                uniqueNodeIds.add(sourceNodeInfo.id);
            }
            if (!uniqueNodeIds.has(targetNodeInfo.id)) {
                mermaidString += `    ${targetNodeInfo.id}["${targetNodeInfo.displayText}"];\n`;
                uniqueNodeIds.add(targetNodeInfo.id);
            }
            mermaidString += `    ${link.sourceId} --> ${link.targetId};\n`;
        }
    }
    
    if (links.length === 0) {
        mermaidString += `    subgraph Note without Links\n`;
        mermaidString += `        ${centralNode.id}_no_links["No outgoing or incoming links found for ${centralNode.displayText}."];\n`;
        mermaidString += `    end\n`;
        // Make the central node link to this message node
        mermaidString += `    ${centralNode.id} -.-> ${centralNode.id}_no_links;\n`;
        mermaidString += `    style ${centralNode.id}_no_links fill:#eee,stroke:#ccc,stroke-width:1px,color:#333;\n`;
    }


    // Depth > 1 implementation would go here, recursively calling for neighbors.
    // For now, depth is limited to 1.
    if (depth > 1) {
        // Placeholder for future depth implementation
        console.warn("ThoughtMap: Depth > 1 not yet implemented. Displaying 1-degree connections only.");
    }

    return mermaidString;
}
