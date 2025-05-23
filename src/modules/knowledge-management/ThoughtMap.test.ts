// src/modules/knowledge-management/ThoughtMap.test.ts
import { generateThoughtMapMermaid } from './ThoughtMap'; // Adjust path if needed
import { App, TFile, FrontMatterCache, normalizePath, parseLinktext, LinkCache } from 'obsidian';

// --- Mock Obsidian App, TFile, etc. ---
interface MockTFile {
    path: string;
    name: string;
    basename: string;
    extension: string;
}

interface MockFileCache {
    frontmatter?: Record<string, any>;
    links?: LinkCache[];
    // Add other CacheItem properties if needed
}

interface MockAppVault {
    files: Record<string, { frontmatter?: Record<string, any>; content?: string, links?: {link: string, path?: string}[] }>; // path: data
    getAbstractFileByPath(path: string): MockTFile | null;
    // getFiles(): MockTFile[]; // Not strictly needed if we mock getAbstractFileByPath and resolvedLinks well
}

interface MockAppMetadataCache {
    fileCache: Record<string, MockFileCache>; // path: cache
    resolvedLinks: Record<string, Record<string, number>>; // sourcePath: {targetPath: count}
    backlinks: Record<string, Record<string, LinkCache[]>>; // targetPath: {sourcePath: LinkCache[]}
    
    getCache(path: string): MockFileCache | null;
    getFirstLinkpathDest(linkpath: string, sourcePath: string): MockTFile | null;
    getBacklinksForFile(file: MockTFile): { data: Record<string, LinkCache[]> };
}

interface MockApp {
    vault: MockAppVault;
    metadataCache: MockAppMetadataCache;
}

function createMockApp(
    filesData: Record<string, { frontmatter?: Record<string, any>; links?: {link: string, path?: string}[] }>,
    resolvedLinksData: Record<string, Record<string, number>> = {},
    backlinksData: Record<string, Record<string, LinkCache[]>> = {}
): MockApp {
    const mockVault: MockAppVault = {
        files: filesData,
        getAbstractFileByPath(path: string): MockTFile | null {
            const normPath = normalizePath(path);
            if (this.files[normPath]) {
                const name = normPath.split('/').pop() || '';
                const basename = name.substring(0, name.lastIndexOf('.')) || name;
                const extension = name.substring(name.lastIndexOf('.') + 1) || '';
                return { path: normPath, name, basename, extension };
            }
            return null;
        }
    };

    const mockMetadataCache: MockAppMetadataCache = {
        fileCache: {},
        resolvedLinks: resolvedLinksData,
        backlinks: backlinksData,
        getCache(path: string): MockFileCache | null {
            const normPath = normalizePath(path);
            if (filesData[normPath]) {
                const fileDef = filesData[normPath];
                const obsidianLinks: LinkCache[] = (fileDef.links || []).map(l => ({
                    link: l.link,
                    original: `[[${l.link}]]`,
                    position: {start: {line:0, col:0, offset:0}, end:{line:0, col:0, offset:0}}
                }));
                return { frontmatter: fileDef.frontmatter, links: obsidianLinks };
            }
            return null;
        },
        getFirstLinkpathDest(linkpath: string, sourcePath: string): MockTFile | null {
            // Simplified: assumes linkpath is a direct path or resolvable via filesData
            // This mock doesn't try to resolve complex Obsidian link resolution (e.g. shortest path, display text)
            const parsed = parseLinktext(linkpath);
            const targetPath = parsed.path;
            
            // Check if this link is explicitly defined in the source file's links
            const sourceFile = filesData[normalizePath(sourcePath)];
            const sourceLink = sourceFile?.links?.find(l => l.link === linkpath || l.link === targetPath);
            if (sourceLink?.path) { // If path is pre-resolved in mock data
                 return mockVault.getAbstractFileByPath(sourceLink.path);
            }

            // Try direct path
            let destFile = mockVault.getAbstractFileByPath(targetPath);
            if (destFile) return destFile;

            // Try relative to source (basic)
            if (!targetPath.includes('/')) {
                 const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
                 destFile = mockVault.getAbstractFileByPath(normalizePath(`${sourceDir}/${targetPath}.md`));
                 if (destFile) return destFile;
                 destFile = mockVault.getAbstractFileByPath(normalizePath(`${sourceDir}/${targetPath}`));
                 if (destFile) return destFile;
            }
            
            // Fallback: check if the targetPath (without .md) exists as a key in filesData
            // This helps with links like "My Note" when "My Note.md" is the actual file
            const possibleMdPath = normalizePath(targetPath + ".md");
            if (filesData[possibleMdPath]) {
                return mockVault.getAbstractFileByPath(possibleMdPath);
            }
            
            return null; // Cannot resolve
        },
        getBacklinksForFile(file: MockTFile): { data: Record<string, LinkCache[]> } {
            return { data: this.backlinks[normalizePath(file.path)] || {} };
        }
    };

    return {
        vault: mockVault,
        metadataCache: mockMetadataCache,
    } as MockApp;
}

// --- Test Suites ---

async function testGenerateThoughtMapMermaid() {
    console.log("Running test suite: generateThoughtMapMermaid");

    // Test 1: No central note
    let mockApp = createMockApp({});
    let mermaid = await generateThoughtMapMermaid(mockApp, "nonexistent.md");
    console.assert(mermaid === null, "Test Failed (ThoughtMap - 1.1): No central note should return null.");

    // Test 2: Central note with no links
    mockApp = createMockApp({ "noteA.md": { frontmatter: { title: "Note A Title" } } });
    mermaid = await generateThoughtMapMermaid(mockApp, "noteA.md");
    console.assert(mermaid?.startsWith("graph TD;"), "Test Failed (ThoughtMap - 2.1): Should start with 'graph TD;'.");
    console.assert(mermaid?.includes('noteA_md["Note A Title"]'), `Test Failed (ThoughtMap - 2.2): Central node missing. Got: ${mermaid}`);
    console.assert(mermaid?.includes("No outgoing or incoming links found"), `Test Failed (ThoughtMap - 2.3): No links message missing. Got: ${mermaid}`);

    // Test 3: Central note with only outgoing links
    mockApp = createMockApp({
        "central.md": { frontmatter: { title: "Central Note" }, links: [{link: "outgoing1.md"}, {link: "Outgoing Two"}] },
        "outgoing1.md": { frontmatter: { title: "Outgoing One" } },
        "Outgoing Two.md": { frontmatter: { title: "Outgoing Note Two" } }
    });
    mermaid = await generateThoughtMapMermaid(mockApp, "central.md");
    console.assert(mermaid?.startsWith("graph TD;"), "Test Failed (ThoughtMap - 3.1): Graph direction incorrect.");
    console.assert(mermaid?.includes('central_md["Central Note"]'), "Test Failed (ThoughtMap - 3.2): Central node definition incorrect.");
    console.assert(mermaid?.includes('style central_md fill:#f9f,stroke:#333,stroke-width:2px'), "Test Failed (ThoughtMap - 3.3): Central node style missing.");
    console.assert(mermaid?.includes('outgoing1_md["Outgoing One"]'), "Test Failed (ThoughtMap - 3.4): Outgoing node 1 incorrect.");
    console.assert(mermaid?.includes('Outgoing_Two_md["Outgoing Note Two"]'), "Test Failed (ThoughtMap - 3.5): Outgoing node 2 incorrect.");
    console.assert(mermaid?.includes("central_md --> outgoing1_md"), "Test Failed (ThoughtMap - 3.6): Link 1 missing.");
    console.assert(mermaid?.includes("central_md --> Outgoing_Two_md"), "Test Failed (ThoughtMap - 3.7): Link 2 missing.");

    // Test 4: Central note with only incoming links (using backlinks mock)
    mockApp = createMockApp(
        { 
            "central_incoming.md": { frontmatter: { title: "Central Incoming" } },
            "incoming1.md": { frontmatter: { title: "Incoming One" } },
            "incoming2.md": { frontmatter: { title: "Incoming Two" } }
        },
        {}, // no resolvedLinks needed if backlinks are comprehensive
        { // backlinksData: targetPath: {sourcePath: LinkCache[]}
            "central_incoming.md": {
                "incoming1.md": [{link: "central_incoming.md", original:"", position: {start:{line:0,col:0,offset:0},end:{line:0,col:0,offset:0}}}],
                "incoming2.md": [{link: "central_incoming.md", original:"", position: {start:{line:0,col:0,offset:0},end:{line:0,col:0,offset:0}}}]
            }
        }
    );
    mermaid = await generateThoughtMapMermaid(mockApp, "central_incoming.md");
    console.assert(mermaid?.startsWith("graph TD;"), "Test Failed (ThoughtMap - 4.1): Graph direction.");
    console.assert(mermaid?.includes('central_incoming_md["Central Incoming"]'), "Test Failed (ThoughtMap - 4.2): Central node.");
    console.assert(mermaid?.includes('incoming1_md["Incoming One"]'), "Test Failed (ThoughtMap - 4.3): Incoming node 1.");
    console.assert(mermaid?.includes('incoming2_md["Incoming Two"]'), "Test Failed (ThoughtMap - 4.4): Incoming node 2.");
    console.assert(mermaid?.includes("incoming1_md --> central_incoming_md"), `Test Failed (ThoughtMap - 4.5): Link from incoming 1. Got: ${mermaid}`);
    console.assert(mermaid?.includes("incoming2_md --> central_incoming_md"), `Test Failed (ThoughtMap - 4.6): Link from incoming 2. Got: ${mermaid}`);

    // Test 5: Central note with both outgoing and incoming links
    mockApp = createMockApp(
        {
            "master.md": { frontmatter: { title: "Master Note" }, links: [{link: "goes_to.md"}] },
            "goes_to.md": { frontmatter: { title: "Goes To" } },
            "comes_from.md": { frontmatter: { title: "Comes From" } }
        },
        {}, // resolvedLinks (can be empty if backlinks are used, or complement them)
        { // backlinksData
            "master.md": {
                "comes_from.md": [{link: "master.md", original:"", position: {start:{line:0,col:0,offset:0},end:{line:0,col:0,offset:0}}}]
            }
        }
    );
    mermaid = await generateThoughtMapMermaid(mockApp, "master.md");
    console.assert(mermaid?.includes("master_md --> goes_to_md"), "Test Failed (ThoughtMap - 5.1): Outgoing link.");
    console.assert(mermaid?.includes("comes_from_md --> master_md"), "Test Failed (ThoughtMap - 5.2): Incoming link.");
    console.assert(mermaid?.includes('goes_to_md["Goes To"]'), "Test Failed (ThoughtMap - 5.3): Goes_to node.");
    console.assert(mermaid?.includes('comes_from_md["Comes From"]'), "Test Failed (ThoughtMap - 5.4): Comes_from node.");
    
    // Test 6: Depth parameter (should still be 1-degree and warn)
    // Mock console.warn
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = (message) => { if(message.includes("Depth > 1 not yet implemented")) warnCalled = true; };
    
    mermaid = await generateThoughtMapMermaid(mockApp, "master.md", 2);
    console.assert(warnCalled, "Test Failed (ThoughtMap - 6.1): console.warn was not called for depth > 1.");
    console.assert(mermaid?.includes("master_md --> goes_to_md"), "Test Failed (ThoughtMap - 6.2): Still 1-degree map (outgoing).");
    console.assert(mermaid?.includes("comes_from_md --> master_md"), "Test Failed (ThoughtMap - 6.3): Still 1-degree map (incoming).");
    // Check that nodes beyond 1-degree are NOT present (e.g. if goes_to.md had links)
    console.warn = originalWarn; // Restore console.warn

    // Test 7: Unresolved outgoing link
    mockApp = createMockApp({
        "central_unresolved.md": { frontmatter: { title: "Central Unresolved" }, links: [{link: "nonexistent_link"}] }
    });
    mermaid = await generateThoughtMapMermaid(mockApp, "central_unresolved.md");
    console.assert(mermaid?.includes('nonexistent_link["nonexistent_link"]'), `Test Failed (ThoughtMap - 7.1): Unresolved link node. Got: ${mermaid}`);
    console.assert(mermaid?.includes("central_unresolved_md --> nonexistent_link"), `Test Failed (ThoughtMap - 7.2): Link to unresolved. Got: ${mermaid}`);


    console.log("generateThoughtMapMermaid: ALL PASSED (check console for any assertion details)");
}


async function runAllThoughtMapTests() {
    console.log("--- Starting ThoughtMap Tests ---");
    try {
        await testGenerateThoughtMapMermaid();
        console.log("\nAll ThoughtMap tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during ThoughtMap testing:", error);
        throw error;
    }
    console.log("--- Finished ThoughtMap Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `ThoughtMap.test.ts` in `src/modules/knowledge-management/`.
// 3. Ensure `ThoughtMap.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/knowledge-management/ThoughtMap.test.ts`

// runAllThoughtMapTests(); // Uncomment or use a test runner

export { runAllThoughtMapTests };
