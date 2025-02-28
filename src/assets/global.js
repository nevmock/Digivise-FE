import { useEffect } from "react";

function GlobalScripts() {
    useEffect(() => {
        const scriptPaths = [
            "/assets/js/app.js",
            "/assets/js/pages/dashboard.js",
            "/assets/vendor/jsvectormap/jsvectormap.min.js",
            "/assets/vendor/jsvectormap/maps/world-merc.js",
            "/assets/vendor/jsvectormap/maps/world.js",
        ];

        scriptPaths.forEach((src) => {
            const script = document.createElement("script");
            script.src = src;
            script.defer = true;
            document.body.appendChild(script);
        });

        return () => {
            scriptPaths.forEach((src) => {
                const script = document.querySelector(`script[src="${src}"]`);
                if (script) document.body.removeChild(script);
            });
        };
    }, []);

    return null;
}

export default GlobalScripts;