import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    toggleThemeWithAnimation: (x: number, y: number) => void;
    isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check local storage first
        const savedTheme = localStorage.getItem("theme") as Theme;
        if (savedTheme) {
            return savedTheme;
        }
        return "light";
    });

    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }, []);

    // Enhanced toggle with clip-path circle expansion animation
    const toggleThemeWithAnimation = useCallback((x: number, y: number) => {
        // Check for View Transitions API support (Chrome 111+, Edge 111+)
        const supportsViewTransitions = 'startViewTransition' in document;

        if (supportsViewTransitions && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Use native View Transitions API for modern browsers
            const root = document.documentElement;

            // Set the CSS custom properties for animation origin
            root.style.setProperty('--theme-transition-x', `${x}px`);
            root.style.setProperty('--theme-transition-y', `${y}px`);

            // Calculate max radius needed to cover screen from click point
            const maxRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );
            root.style.setProperty('--theme-transition-radius', `${maxRadius}px`);

            setIsTransitioning(true);

            // @ts-ignore - View Transitions API
            document.startViewTransition(() => {
                document.documentElement.classList.add('stop-transitions');
                flushSync(() => {
                    setTheme((prev) => (prev === "light" ? "dark" : "light"));
                });
            }).finished.then(() => {
                document.documentElement.classList.remove('stop-transitions');
                setIsTransitioning(false);
            }).catch(() => {
                document.documentElement.classList.remove('stop-transitions');
                setIsTransitioning(false);
            });

        } else {
            // Fallback with CSS animations for unsupported browsers
            const root = document.documentElement;

            // Set animation origin coordinates
            root.style.setProperty('--theme-transition-x', `${x}px`);
            root.style.setProperty('--theme-transition-y', `${y}px`);

            // Calculate max radius
            const maxRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );
            root.style.setProperty('--theme-transition-radius', `${maxRadius}px`);

            setIsTransitioning(true);
            root.classList.add('theme-transitioning');

            // Toggle theme
            setTheme((prev) => (prev === "light" ? "dark" : "light"));

            // Clean up after animation completes
            transitionTimeoutRef.current = setTimeout(() => {
                root.classList.remove('theme-transitioning');
                setIsTransitioning(false);
            }, 400); // Match the CSS transition duration
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, toggleThemeWithAnimation, isTransitioning }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
