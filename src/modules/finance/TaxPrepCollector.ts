// src/modules/finance/TaxPrepCollector.ts
import { App, TFile, getAllTags, FrontMatterCache, EmbedCache } from 'obsidian'; // Added FrontMatterCache, EmbedCache

export interface TaxRelevantAttachment {
    fileName: string;       // Best guess of the attachment's filename
    originalLink: string;   // The raw link text from the markdown
    resolvedFullPath?: string; // Absolute path in the vault if resolvable
}

export interface TaxRelevantItem {
    filePath: string;                 // Path to the markdown note
    tags?: string[];                  // All tags found in the note (original case)
    attachments?: TaxRelevantAttachment[]; // Attachments/embeds in the note
    title?: string;                   // Title of the note (basename)
    // Potentially add specific frontmatter fields like date, amount if they become common
    // rawFrontmatter?: any; // Optional: to store all frontmatter if needed later
}

export async function findTaxRelevantItems(app: App, taxTagToSearch: string): Promise<TaxRelevantItem[]> {
    const relevantItems: TaxRelevantItem[] = [];
    const files: TFile[] = app.vault.getMarkdownFiles();

    // Normalize taxTagToSearch: ensure it starts with '#' and convert to lowercase for comparison.
    const normalizedSearchTag = (taxTagToSearch.startsWith('#') ? taxTagToSearch : `#${taxTagToSearch}`).toLowerCase();

    for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        if (!cache) {
            continue;
        }

        // Get all tags from the note, convert to lowercase for case-insensitive matching
        const noteTagsOriginal = getAllTags(cache) || []; // Keep original case for storage
        const noteTagsLowercase = noteTagsOriginal.map(t => t.toLowerCase());

        if (noteTagsLowercase.includes(normalizedSearchTag)) {
            const attachments: TaxRelevantAttachment[] = [];
            if (cache.embeds) {
                for (const embed of cache.embeds) {
                    // Use displayText if available, otherwise derive from link.
                    // For a simple file link like ![[file.pdf]], embed.link might be "file.pdf"
                    // and displayText might be the same or different if aliased.
                    let fileName = embed.displayText || embed.link;
                    // A more robust way to get filename from path:
                    if (embed.link.includes('/')) {
                        fileName = embed.link.substring(embed.link.lastIndexOf('/') + 1);
                    } else {
                        fileName = embed.link; // It's already likely just the filename
                    }
                    
                    const resolvedFile = app.metadataCache.getFirstLinkpathDest(embed.link, file.path);
                    attachments.push({
                        fileName: fileName,
                        originalLink: embed.link,
                        resolvedFullPath: resolvedFile?.path,
                    });
                }
            }

            relevantItems.push({
                filePath: file.path,
                title: file.basename,
                tags: noteTagsOriginal, // Store original case tags
                attachments: attachments.length > 0 ? attachments : undefined, // Only add if attachments exist
            });
        }
    }
    return relevantItems;
}
