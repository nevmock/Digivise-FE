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
                        
                        script.onerror = () => reject(`❌ Error loading: ${src}`);
                        
                        document.head.appendChild(script); // Pakai head, bukan body
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Cek apakah ThemeLayout class ada di window
                if (typeof window.ThemeLayout !== 'undefined') {
                    
                    // Jika belum ada instance, buat
                    if (!window.themeLayout) {
                        window.themeLayout = new window.ThemeLayout();
                        window.themeLayout.init();
                    }
                } else {
                    console.error("❌ ThemeLayout class still not found");
                    
                    // console.log("Available window properties:", 
                    //     Object.keys(window).filter(key => 
                    //         key.includes('Theme') || key.includes('theme')
                    //     )
                    // );
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
            
            // Cleanup global variables jika perlu
            if (window.themeLayout) {
                delete window.themeLayout;
            }
        };
    }, []);

    return null;
}

export default GlobalScripts;