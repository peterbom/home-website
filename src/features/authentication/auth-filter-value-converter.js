export class AuthFilterValueConverter {

    toView(routes, permissions) {
        return routes.filter(route =>
            !route.config.perm ||
            typeof route.config.perm !== "string" ||
            permissions.indexOf(route.config.perm) >= 0);
    }
}
