import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function NhiaNyscItemsMatrix({ refId, hcpCode, selectedItems = [], setSelectedItems }) {
  const [itemQuery, setItemQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Debounced simultaneous search across procedure_nhia and drugs_nhia
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const normalizedQuery = itemQuery ? itemQuery.trim() : "";
      if (!normalizedQuery) {
        setSearchResults([]);
        return;
      }

      setLoading(true);

      try {
        const [procRes, drugRes] = await Promise.all([
          supabase.from("procedure_nhia")
            .select("*")
            .ilike("description", `%${normalizedQuery}%`),
          supabase.from("drugs_nhia")
            .select("*")
            .ilike("description", `%${normalizedQuery}%`)
        ]);

        if (procRes.error) console.error("Procedure query error:", procRes.error.message);
        if (drugRes.error) console.error("Drug query error:", drugRes.error.message);

        const procData = procRes.data?.map(p => ({ ...p, type: "procedure" })) || [];
        const drugData = drugRes.data?.map(d => ({ ...d, type: "drug" })) || [];

        setSearchResults([...procData, ...drugData]);
      } catch (err) {
        console.error("Search system error:", err.message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [itemQuery]);

  const handleSelect = (item) => {
    if (!item) return;

    const baseDescription = item.description || item.itemname || "";
    
    // Conditionally collect extra attributes
    let extraMeta = [];
    if (item.strengths || item.strength) extraMeta.push(item.strengths || item.strength);
    if (item.presentation) extraMeta.push(item.presentation);
    if (item.dosage) extraMeta.push(item.dosage);
    
    const finalDescription = extraMeta.length > 0 
      ? `${baseDescription} (${extraMeta.join(" - ")})` 
      : baseDescription;

    setSelectedItems([
      ...selectedItems,
      {
        refid: refId,
        type: item.type,
        nhiacode: item.nhiacode || "",
        description: finalDescription, 
        dosage: item.dosage || "",
        strengths: item.strengths || item.strength || "",
        presentation: item.presentation || "",
        price: Number(item.price) || 0,
        quantity: 1,
        period: 1,
        total: Number(item.price) || 0,
        hospitalname: item.hospitalname || "",
        hcpcode: hcpCode
      }
    ]);
    setSearchResults([]);
    setItemQuery("");
  };

  const updateLine = (index, field, value) => {
    const updated = [...selectedItems];
    if (!updated[index]) return;
    
    updated[index] = { ...updated[index], [field]: value };

    const p = parseFloat(updated[index].price) || 0;
    const q = parseFloat(updated[index].quantity) || 0;
    const per = parseFloat(updated[index].period) || 1;

    updated[index].total = p * q * per;
    setSelectedItems(updated);
  };

  const removeLine = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };
  return (
    <div className="space-y-4 relative">
      <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
        <i className="bi bi-capsule text-sm"></i> 2. Treatment Procedures & Drugs Allocation
      </h3>

      {/* Search Input */}
      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
          Search Procedures & Drugs Catalogue
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            placeholder="Type procedure or drug names..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-2.5 text-sm focus:border-blue-500 focus:bg-white"
          />
          {loading && (
            <span className="absolute right-4 text-blue-600 animate-spin spinner-border spinner-border-sm w-4 h-4 border-2 border-t-transparent rounded-full"></span>
          )}
        </div>

        {/* Results Dropdown */}
        {searchResults.length > 0 && (
          <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl mt-1 max-h-52 overflow-y-auto divide-y divide-slate-100 shadow-xl">
            {searchResults.map((item) => {
              const baseName = item.description || item.itemname || "Item";
              const str = item.strengths || item.strength || "";
              const pres = item.presentation || "";
              const dose = item.dosage || "";
              
              // Multi-line tooltip builder text block
              const tooltipText = `Click to allocate:\n• Name: ${baseName}\n${str ? `• Strength: ${str}\n` : ""}${pres ? `• Pres: ${pres}\n` : ""}${dose ? `• Dosage: ${dose}\n` : ""}• Price: ₦${Number(item.price || 0).toLocaleString("en-NG")}`;

              return (
                <li key={item.id || item.nhiacode}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    title={tooltipText}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-medium flex justify-between items-center transition-colors group"
                  >
                    <span className="font-bold text-slate-900 truncate max-w-[75%]">
                      <i className="bi bi-plus-circle-fill text-emerald-500 mr-2 group-hover:scale-110 transition-transform inline-block"></i>
                      {baseName}
                      <span className="ml-2 text-[10px] uppercase text-slate-400 font-normal">({item.type})</span>
                    </span>
                    <span className="font-mono bg-slate-100 border text-slate-600 font-bold px-2 py-0.5 rounded shrink-0">
                      ₦{Number(item.price).toLocaleString("en-NG")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Matrix Table */}
      {selectedItems.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner mt-4 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-[10px] font-bold text-slate-200 uppercase border-b border-slate-700">
                  <th className="p-3 pl-4">Item / Service</th>
                  <th className="p-3 w-28 text-right">Price</th>
                  <th className="p-3 w-20 text-center">Quantity</th>
                  <th className="p-3 w-20 text-center">Period</th>
                  <th className="p-3 w-32 text-right">Total</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 bg-white">
                {selectedItems.map((service, index) => (
                  <tr key={index} className="hover:bg-slate-50/60">
                    <td className="p-3 pl-4 font-semibold text-slate-900 max-w-[220px]">
                      {service.description}
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        readOnly
                        value={service.price} 
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-1 font-mono text-right cursor-not-allowed outline-none" 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="1" 
                        value={service.quantity} 
                        onChange={(e) => updateLine(index, "quantity", e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-center focus:border-blue-500 focus:bg-white outline-none" 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="1" 
                        value={service.period} 
                        onChange={(e) => updateLine(index, "period", e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-center focus:border-blue-500 focus:bg-white outline-none" 
                      />
                    </td>
                    <td className="p-3 text-right font-mono font-black text-blue-600">
                      ₦{Number(service.total).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center pr-4">
                      <button type="button" onClick={() => removeLine(index)} className="text-slate-400 hover:text-red-500"><i className="bi bi-trash3-fill"></i></button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t border-slate-200 font-black text-slate-900 text-xs">
                  <td colSpan="4" className="p-3 pr-4 text-right text-slate-400">Estimated Net:</td>
                  <td colSpan="2" className="p-3 text-right pr-12 font-mono text-sm text-emerald-600">
                    ₦{selectedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
