"use client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingButtonProps {
    loading: boolean;
    text: string;
    loadingText?: string;
    type?: "button" | "submit";
}

const LoadingButton = ({ loading, text, loadingText = "Please wait...", type = "submit" }: LoadingButtonProps) => {
    return (
        <Button type={type} className="w-full" disabled={loading}>
            {
                loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText}
                    </>
                ) : (text)
            }
        </Button>
    );
}

export default LoadingButton;