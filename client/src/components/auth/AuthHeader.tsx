"use client";

interface AuthHeaderProps {
    title: string;
    subtitle: string;
}

const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
    return (
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
                {title}
            </h2>

            <p className="text-sm text-muted-foreground">
                {subtitle}
            </p>
        </div>
    );
}

export default AuthHeader;