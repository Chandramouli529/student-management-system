import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "../styles/DataTable.module.css";

// Rows beyond this count still render normally, they just don't get the
// entrance animation — staggering thousands of DOM nodes serves no visual
// purpose (most are off-screen) and was the actual cause of "slow loading"
// whenever the row set changed on every keystroke of a search box.
const MAX_ANIMATED_ROWS = 60;
// Hard cap on total animation time no matter how many rows are animated —
// without this, stagger time scales linearly with row count and a few
// hundred rows meant several seconds of replaying animation on every
// filter/search change.
const MAX_TOTAL_STAGGER = 0.5;

export default function DataTable({ columns, rows, emptyLabel = "No records yet." }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    const rowEls = bodyRef.current.querySelectorAll(`.${styles.row}`);
    if (rowEls.length === 0) return;

    const animatedEls = Array.from(rowEls).slice(0, MAX_ANIMATED_ROWS);
    const stagger = Math.min(0.04, MAX_TOTAL_STAGGER / animatedEls.length);

    gsap.fromTo(
      animatedEls,
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", stagger, overwrite: "auto" }
    );
  }, [rows]);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr className={styles.row} key={row.id ?? i}>
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}