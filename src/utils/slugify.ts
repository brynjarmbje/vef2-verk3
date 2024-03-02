export function generateSlug(name: string): string {
    return name
        .toLowerCase() // Convert to lowercase
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove all non-alphanumeric characters except hyphens
}