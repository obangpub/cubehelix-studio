import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./icons";

export function AboutDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClose = () => setOpen(false);
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) setOpen(false);
  };

  return (
    <>
      <button type="button" className="header-button" onClick={() => setOpen(true)}>
        About
      </button>
      <dialog
        ref={dialogRef}
        className="about-dialog"
        onClose={handleClose}
        onClick={handleBackdropClick}
      >
        <div className="about-dialog-content">
          <button
            type="button"
            className="about-dialog-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <h2>About Cubehelix Studio</h2>
          <p>
            Cubehelix Studio is an interactive playground for designing cubehelix color palettes —
            color schemes that get steadily brighter from one end to the other. Because the
            brightness never doubles back, the palette stays readable in grayscale, under
            colorblindness, and in print.
          </p>

          <h3>The cubehelix scheme</h3>
          <p>The cubehelix scheme was introduced by Dave Green in:</p>
          <blockquote>
            Green, D. A., 2011, "A colour scheme for the display of astronomical intensity images",{" "}
            <em>Bulletin of the Astronomical Society of India</em>, 39, 289.
          </blockquote>
          <p>
            Reference page:{" "}
            <a href="https://people.phy.cam.ac.uk/dag9/CUBEHELIX/" target="_blank" rel="noreferrer">
              people.phy.cam.ac.uk/dag9/CUBEHELIX/
            </a>
            . If you use cubehelix in a publication, please cite the paper.
          </p>

          <h3>Project</h3>
          <p>
            Cubehelix Studio ships two libraries — <code>@cubehelix-studio/core</code> (TypeScript)
            and <code>cubehelix-studio</code> (Python) — plus this web app. Both libraries are kept
            in lockstep by a shared parity fixture.
          </p>
          <p>
            Source:{" "}
            <a href="https://github.com/obangpub/cubehelix-studio" target="_blank" rel="noreferrer">
              github.com/obangpub/cubehelix-studio
            </a>
          </p>
          <p>
            Cubehelix Studio is created by Joseph J. Thiebes and published under his O! Press
            imprint.
          </p>

          <h3>Support</h3>
          <p>
            Cubehelix Studio is free and open-source. If it has been useful to you, you can{" "}
            <a href="https://ko-fi.com/josephthiebes" target="_blank" rel="noreferrer">
              buy me a coffee on Ko-fi
            </a>
            .
          </p>

          <h3>License</h3>
          <p>
            This codebase is{" "}
            <a
              href="https://github.com/obangpub/cubehelix-studio/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
            >
              MIT-licensed
            </a>
            . The MIT license covers the code in this project; it does not extend to the cubehelix
            algorithm itself, which is described in the paper above.
          </p>
        </div>
      </dialog>
    </>
  );
}
