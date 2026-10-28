import { useEffect, useState } from "react";

export const DESIGN_WIDTH = 1440; // lebar desain di SVG

const getWidth = () =>
  typeof window === "undefined" ? DESIGN_WIDTH : document.documentElement.clientWidth;

export function useViewportWidth() {
  const [vw, setVw] = useState<number>(getWidth);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflowX = "hidden";
    const onResize = () => setVw(getWidth());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vw;
}