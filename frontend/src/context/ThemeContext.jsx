
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'gasconnect-theme';

const getSavedTheme = () => {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        return ['light', 'dark', 'system'].includes(savedTheme)
            ? savedTheme
            : 'light';
    } catch {
        return 'light';
    }
};

const getSystemTheme = () => {
    if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
        return 'dark';
    }

    return 'light';
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getSavedTheme);
    const [systemTheme, setSystemTheme] = useState(getSystemTheme);

    // Watch for changes in the device's theme.
    useEffect(() => {
        const mediaQuery = window.matchMedia(
            '(prefers-color-scheme: dark)'
        );

        const handleSystemThemeChange = (event) => {
            setSystemTheme(event.matches ? 'dark' : 'light');
        };

        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener(
                'change',
                handleSystemThemeChange
            );
        };
    }, []);

    // Save the preference and apply the resolved theme globally.
    useEffect(() => {
        const resolvedTheme =
            theme === 'system' ? systemTheme : theme;

        document.documentElement.setAttribute(
            'data-theme',
            resolvedTheme
        );

        document.documentElement.style.colorScheme = resolvedTheme;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.error('Unable to save theme preference:', error);
        }
    }, [theme, systemTheme]);

    const value = {
        theme,
        setTheme,
        resolvedTheme: theme === 'system' ? systemTheme : theme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            'useTheme must be used inside ThemeProvider.'
        );
    }

    return context;
}
