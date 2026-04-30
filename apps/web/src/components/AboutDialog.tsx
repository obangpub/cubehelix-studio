import { useEffect, useRef, useState } from "react";

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
            ×
          </button>
          <h2>About Cubehelix Studio</h2>
          <p>
            Cubehelix Studio is an interactive playground for designing cubehelix color palettes —
            sequential color schemes whose luminance increases monotonically, so they remain
            interpretable in grayscale, under colorblindness, and in print.
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

          <h3>License</h3>
          <p>
            This codebase is MIT-licensed. The MIT license covers the code in this project; it does
            not extend to the cubehelix algorithm itself, which is described in the paper above.
          </p>
        </div>
      </dialog>
    </>
  );
}
