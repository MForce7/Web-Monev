export default function GayaDropdown() {
  return (
    <style>{`
      .dd-kecil button[aria-haspopup="listbox"] {
        display: block !important;
        font-size: 12px !important;
        line-height: 2.25rem !important;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 2.25rem !important;
        padding-right: 2.25rem !important;
      }
    `}</style>
  );
}