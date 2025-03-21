const useDebounce = (fn: any) => {
    // const clock = useRef(0);
    let clock: any;
    const debouncedFn = () => {
        clearInterval(clock)
        clock = setTimeout(fn, 30);
    }

    return debouncedFn;
}

export default useDebounce;