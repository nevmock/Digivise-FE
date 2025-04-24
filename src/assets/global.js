// import { useEffect } from "react";

// function GlobalScripts() {
//     useEffect(() => {
//         const scriptPaths = [
//             "/assets/js/app.js",
//             "/assets/js/pages/dashboard.js",
//         ];

//         scriptPaths.forEach((src) => {
//             const script = document.createElement("script");
//             script.src = src;
//             script.defer = true;
//             document.body.appendChild(script);
//         });

//         return () => {
//             scriptPaths.forEach((src) => {
//                 const script = document.querySelector(`script[src="${src}"]`);
//                 if (script) document.body.removeChild(script);
//             });
//         };
//     }, []);

//     return null;
// }

// export default GlobalScripts;



import { useEffect } from "react";

function GlobalScripts() {
    useEffect(() => {
        const scriptPaths = [
            "/assets/js/app.js",
            "/assets/js/pages/dashboard.js",
        ];

        const loadScripts = () => {
            return new Promise((resolve, reject) => {
                let loadedScripts = 0;
                const totalScripts = scriptPaths.length;

                scriptPaths.forEach((src) => {
                    const script = document.createElement("script");
                    script.src = src;
                    script.defer = true;

                    script.onload = () => {
                        loadedScripts++;
                        if (loadedScripts === totalScripts) {
                            resolve();
                        }
                    };

                    script.onerror = () => {
                        reject(`Error loading script: ${src}`);
                    };

                    document.body.appendChild(script);
                });
            });
        };

        loadScripts()
            .then(() => {
                if (window.ThemeLayout) {
                    console.log("ThemeLayout loaded successfully!");
                } else {
                    console.error("ThemeLayout is still undefined.");
                }
            })
            .catch((error) => {
                console.error(error);
            });

        return () => {
            scriptPaths.forEach((src) => {
                const script = document.querySelector(`script[src="${src}"]`);
                if (script) {
                    document.body.removeChild(script);
                }
            });
        };
    }, []);

    return null;
}

export default GlobalScripts;