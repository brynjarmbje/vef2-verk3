export function generateSlug(name: string): string {
    return name
        .toLowerCase() // Convert to lowercase
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Normalize letters and remove accent marks
        .replace(/ð/g, 'd') // Replace ð with d
        .replace(/þ/g, 'th') // Replace þ with th
        .replace(/æ/g, 'ae') // Replace æ with ae
        .replace(/ö/g, 'o') // Replace ö with o
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove all non-alphanumeric characters except hyphens
}