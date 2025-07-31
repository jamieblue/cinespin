export const scrollLock = {
    enable: () =>
    {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${ window.innerWidth - document.documentElement.clientWidth }px`; // Prevent layout shift
    },
    disable: () =>
    {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
};