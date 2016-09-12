export function configure(aurelia) {
    aurelia.globalResources(
        "./auth-filter-value-converter",
        "./blob-to-url-value-converter",
        "./data-uri-value-converter",
        "./date-time-format-value-converter",
        "./file-list-to-array-value-converter");
}