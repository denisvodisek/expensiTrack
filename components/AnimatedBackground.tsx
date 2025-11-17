import React from 'react';

interface AnimatedBackgroundProps {
    page: 'dashboard' | 'expenses' | 'subscriptions' | 'profile';
}

// Animated background component - varies by page
const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ page }) => {
    const getPageConfig = () => {
        switch (page) {
            case 'dashboard':
                return {
                    gradientId: 'dashboardGradient',
                    colors: [
                        'rgb(59, 130, 246)', // blue
                        'rgb(147, 51, 234)', // purple
                        'rgb(236, 72, 153)'  // pink
                    ],
                    opacities: ['0.08', '0.12', '0.06'],
                    animationName: 'dashboardFlow',
                    duration: '12s'
                };

            case 'expenses':
                return {
                    gradientId: 'expensesGradient',
                    colors: [
                        'rgb(239, 68, 68)',  // red
                        'rgb(245, 158, 11)', // amber
                        'rgb(34, 197, 94)'   // green
                    ],
                    opacities: ['0.07', '0.10', '0.05'],
                    animationName: 'expensesFlow',
                    duration: '14s'
                };

            case 'subscriptions':
                return {
                    gradientId: 'subscriptionsGradient',
                    colors: [
                        'rgb(139, 92, 246)',  // violet
                        'rgb(59, 130, 246)',  // blue
                        'rgb(16, 185, 129)'   // emerald
                    ],
                    opacities: ['0.08', '0.11', '0.06'],
                    animationName: 'subscriptionsFlow',
                    duration: '16s'
                };

            case 'profile':
                return {
                    gradientId: 'profileGradient',
                    colors: [
                        'rgb(236, 72, 153)',  // pink
                        'rgb(168, 85, 247)',  // violet
                        'rgb(59, 130, 246)'   // blue
                    ],
                    opacities: ['0.07', '0.09', '0.05'],
                    animationName: 'profileFlow',
                    duration: '18s'
                };

            default:
                return {
                    gradientId: 'defaultGradient',
                    colors: ['rgb(59, 130, 246)', 'rgb(147, 51, 234)', 'rgb(236, 72, 153)'],
                    opacities: ['0.08', '0.12', '0.06'],
                    animationName: 'defaultFlow',
                    duration: '12s'
                };
        }
    };

    const config = getPageConfig();

    return (
        <div className="fixed top-0 left-0 right-0 h-[40vh] -z-10 overflow-hidden">
            <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                style={{ transform: 'rotate(180deg)' }}
            >
                <defs>
                    <linearGradient id={config.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={config.colors[0]} stopOpacity={config.opacities[0]} />
                        <stop offset="50%" stopColor={config.colors[1]} stopOpacity={config.opacities[1]} />
                        <stop offset="100%" stopColor={config.colors[2]} stopOpacity={config.opacities[2]} />
                    </linearGradient>
                </defs>
                <path
                    fill={`url(#${config.gradientId})`}
                    d="M0,160L80,138.7C160,117,320,75,480,64C640,53,800,75,960,69.3C1120,64,1280,32,1360,16L1440,0L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                    style={{
                        animation: `${config.animationName} ${config.duration} ease-in-out infinite, ${config.animationName}Drift 22s ease-in-out infinite`
                    }}
                />
            </svg>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes ${config.animationName} {
                        0%, 100% { transform: translateY(0px) scale(1); }
                        50% { transform: translateY(-10px) scale(1.05); }
                    }
                    @keyframes ${config.animationName}Drift {
                        0%, 100% { transform: translateX(0px) rotate(0deg); }
                        25% { transform: translateX(12px) rotate(0.8deg); }
                        50% { transform: translateX(-8px) rotate(-0.5deg); }
                        75% { transform: translateX(6px) rotate(0.3deg); }
                    }
                `
            }} />
        </div>
    );
};

export default AnimatedBackground;
