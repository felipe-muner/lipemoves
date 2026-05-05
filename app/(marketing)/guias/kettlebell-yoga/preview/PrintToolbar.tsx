"use client"

export default function PrintToolbar() {
  return (
    <div className="pdf-toolbar">
      <div>
        <strong>Modo impressão:</strong> Cmd+P (Mac) / Ctrl+P (Win) → Destino:{" "}
        <em>Save as PDF</em> → Tamanho: <em>A4</em> → Margens: <em>None</em> → Desmarque{" "}
        <em>Headers and footers</em>
      </div>
      <button onClick={() => window.print()} className="pdf-toolbar-button" type="button">
        Imprimir / Salvar PDF
      </button>
    </div>
  )
}
