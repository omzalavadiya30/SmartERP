"use client";
import { Building2, Sparkles } from "lucide-react";

const Logo = () => {
    return (
        <div className="flex flex-col items-start gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg ring-1 ring-white/20">
                <Building2 className="h-7 w-7" />
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight">Smart ERP</h1>
                    <Sparkles className="h-4 w-4 text-sky-300" />
                </div>
                <p className="mt-1 text-sm text-slate-300">Billing • Inventory • Accounting</p>
            </div>
        </div>
    );
}

export default Logo;