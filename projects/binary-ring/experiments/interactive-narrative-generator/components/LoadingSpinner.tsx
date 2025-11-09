
import React from 'react';

const LoadingSpinner: React.FC = () => {
    const messages = [
        "Weaving the threads of fate...",
        "Consulting the ancient scrolls...",
        "Charging the narrative engine...",
        "Crafting your next chapter...",
        "Navigating the story stream...",
    ];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 3000);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <svg
                className="animate-spin h-12 w-12 text-indigo-400 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            <p className="text-lg text-gray-300 font-semibold">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
