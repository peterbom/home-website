export function configure(aurelia) {
    aurelia.globalResources(
        "./auth-filter-value-converter",
        "./data-uri-value-converter",
        "./date-time-format-value-converter");
}