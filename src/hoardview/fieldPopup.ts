type FieldPopupOptions = {
    anchor: HTMLElement,
    onClose: () => void,
};


export const fieldPopup = (element: HTMLElement, options?: FieldPopupOptions) => {
    if (!options) return;
    const { anchor, onClose } = options;
    const document = anchor.ownerDocument;
    const window = document.defaultView;
    if (!window) return;

    const position = (): void => {
        const bounds = anchor.getBoundingClientRect();
        const popup = element.getBoundingClientRect();
        const margin = parseFloat(window.getComputedStyle(document.documentElement).fontSize) / 2;
        const left = Math.max(margin, Math.min(bounds.left, window.innerWidth - popup.width - margin));
        const below = bounds.bottom + popup.height <= window.innerHeight - margin;
        const top = Math.max(margin, Math.min(
            below ? bounds.bottom : bounds.top - popup.height,
            window.innerHeight - popup.height - margin,
        ));
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
    };

    const onToggle = (event: ToggleEvent): void => {
        if (event.newState === "closed") onClose();
    };
    const onScroll = (event: Event): void => {
        if (!event.composedPath().includes(element)) onClose();
    };

    element.addEventListener("toggle", onToggle);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", position);
    element.showPopover();
    position();
    element.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });

    return {
        destroy: () => {
            element.removeEventListener("toggle", onToggle);
            document.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", position);
        },
    };
};
