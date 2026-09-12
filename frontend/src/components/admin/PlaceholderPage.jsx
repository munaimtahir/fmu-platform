const PlaceholderPage = ({ title, description }) => {
    return (
        <div className="bg-white rounded-2xl shadow-md border border-surface-border transition-all duration-150 p-6">
            <h1 className="text-h2 text-ink-primary mb-2">{title}</h1>
            {description && (
                <p className="text-ink-secondary mb-4">{description}</p>
            )}
            <div className="mt-8 p-8 bg-surface rounded-lg text-center">
                <p className="text-ink-muted">This page is under development.</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
