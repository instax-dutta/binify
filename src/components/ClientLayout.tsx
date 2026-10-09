export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-[#121212]">
            {children}
        </div>
    );
}
