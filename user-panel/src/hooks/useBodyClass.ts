import { useEffect } from 'react'

// Declaratively sync a boolean to a class on <body>. This is the controlled,
// state-driven replacement for the Angular jQuery `$('body').addClass/removeClass`
// toggles (`sidebar-enable`, `right-bar-enabled`) that the global styles target.
export function useBodyClass(className: string, active: boolean): void {
  useEffect(() => {
    const body = document.body
    if (active) body.classList.add(className)
    else body.classList.remove(className)
    return () => body.classList.remove(className)
  }, [className, active])
}
