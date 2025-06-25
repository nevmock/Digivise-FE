import { useEffect } from "react";

function GlobalScripts() {
    useEffect(() => {
        const scriptPaths = [
            "/assets/js/app.js",
            "/assets/js/pages/dashboard.js",
        ];

        const loadScripts = async () => {
            try {
                // Load scripts berurutan
                for (const src of scriptPaths) {
                    await new Promise((resolve, reject) => {
                        const existingScript = document.querySelector(`script[src="${src}"]`);
                        if (existingScript) {
                            resolve();
                            return;
                        }

                        const script = document.createElement("script");
                        script.src = src;
                        script.async = false;
                        
                        script.onload = () => {
                            resolve();
                        };
                        
                        script.onerror = () => reject(`Error load source : ${src}`);
                        
                        document.head.appendChild(script); // Pakai head, bukan body
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Cek apakah ThemeLayout class ada di window
                if (typeof window.ThemeLayout !== 'undefined') {
                    
                    // Jika belum ada instance, buat baru
                    if (!window.themeLayout) {
                        window.themeLayout = new window.ThemeLayout();
                        window.themeLayout.init();
                    }
                } else {
                    console.error("ThemeLayout class still not found");
                }
                
            } catch (error) {
                console.error("Script loading error:", error);
            }
        };

        loadScripts();

        // Cleanup
        return () => {
            scriptPaths.forEach((src) => {
                const script = document.querySelector(`script[src="${src}"]`);
                if (script) {
                    script.remove();
                }
            });
            
            if (window.themeLayout) {
                delete window.themeLayout;
            }
        };
    }, []);

    return null;
}

export default GlobalScripts;