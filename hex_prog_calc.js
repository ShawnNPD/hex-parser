import React, { useState, useEffect, useMemo } from 'react';
import { Settings, ArrowRightLeft, Binary, Hash, Info } from 'lucide-react';

export default function HexParserApp() {
    const [inputValue, setInputValue] = useState('A1 B2 C3 D4');
    const [inputType, setInputType] = useState('hex'); // 'hex' or 'binary'
    const [endianness, setEndianness] = useState('big'); // 'big' or 'little'
    const [signedness, setSignedness] = useState('unsigned'); // 'unsigned' or 'signed'

    // Parse input into up to 4 bytes
    const bytes = useMemo(() => {
        let parsedBytes = [];

        if (inputType === 'hex') {
            const cleanHex = inputValue.replace(/[^0-9A-Fa-f]/g, '');
            for (let i = 0; i < cleanHex.length; i += 2) {
                let chunk = cleanHex.substring(i, i + 2);
                if (chunk.length === 1) chunk = '0' + chunk; // Left-pad incomplete byte
                parsedBytes.push(parseInt(chunk, 16));
            }
        } else {
            const cleanBin = inputValue.replace(/[^01]/g, '');
            for (let i = 0; i < cleanBin.length; i += 8) {
                let chunk = cleanBin.substring(i, i + 8);
                if (chunk.length < 8) chunk = chunk.padStart(8, '0'); // Left-pad incomplete byte
                parsedBytes.push(parseInt(chunk, 2));
            }
        }

        // Ensure we have exactly 4 bytes for calculations (pad right with 0s if missing)
        const memory = [0, 0, 0, 0];
        parsedBytes.slice(0, 4).forEach((b, i) => {
            memory[i] = b;
        });

        return {
            memory,
            activeCount: Math.min(parsedBytes.length, 4)
        };
    }, [inputValue, inputType]);

    // Conversion Helpers
    const toSigned8 = (val) => (val & 0x80 ? val - 0x100 : val);
    const toSigned16 = (val) => (val & 0x8000 ? val - 0x10000 : val);
    const toSigned32 = (val) => val | 0;
    const toUnsigned32 = (val) => val >>> 0;

    // Calculate Values
    const calculations = useMemo(() => {
        const mem = bytes.memory;
        const isSigned = signedness === 'signed';
        const isLittle = endianness === 'little';

        // 16-bit Pair 1 (Word 0)
        let w0 = isLittle ? (mem[1] << 8) | mem[0] : (mem[0] << 8) | mem[1];
        let w0Final = isSigned ? toSigned16(w0) : w0;

        // 16-bit Pair 2 (Word 1)
        let w1 = isLittle ? (mem[3] << 8) | mem[2] : (mem[2] << 8) | mem[3];
        let w1Final = isSigned ? toSigned16(w1) : w1;

        // 32-bit Full Word
        let dword = isLittle
            ? (mem[3] << 24) | (mem[2] << 16) | (mem[1] << 8) | mem[0]
            : (mem[0] << 24) | (mem[1] << 16) | (mem[2] << 8) | mem[3];
        let dwordFinal = isSigned ? toSigned32(dword) : toUnsigned32(dword);

        // 8-bit Bytes
        let bFinal = mem.map((b) => (isSigned ? toSigned8(b) : b));

        return {
            w0: w0Final,
            w1: w1Final,
            dword: dwordFinal,
            b: bFinal,
            w0Hex: w0.toString(16).padStart(4, '0').toUpperCase(),
            w1Hex: w1.toString(16).padStart(4, '0').toUpperCase(),
            dwordHex: toUnsigned32(dword).toString(16).padStart(8, '0').toUpperCase()
        };
    }, [bytes, endianness, signedness]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Byte Parser & Converter</h1>
                            <p className="text-slate-500 text-sm">Convert Hex/Binary to Decimal with Endianness rules</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Input Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="font-semibold text-sm text-slate-700">Data Input (Up to 4 bytes)</label>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => { setInputType('hex'); setInputValue(''); }}
                                        className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${inputType === 'hex' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Hash size={14} /> Hex
                                    </button>
                                    <button
                                        onClick={() => { setInputType('binary'); setInputValue(''); }}
                                        className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${inputType === 'binary' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Binary size={14} /> Binary
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputType === 'hex' ? 'e.g., A1 B2 C3 D4' : 'e.g., 10100001 10110010'}
                                className="w-full text-lg p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono transition-shadow"
                            />
                        </div>

                        {/* Settings Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="font-semibold text-sm text-slate-700 block mb-2">Endianness (Byte Order)</label>
                                <div className="flex bg-slate-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setEndianness('big')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${endianness === 'big' ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Big Endian
                                    </button>
                                    <button
                                        onClick={() => setEndianness('little')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${endianness === 'little' ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Little Endian
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-sm text-slate-700 block mb-2">Data Type (Sign)</label>
                                <div className="flex bg-slate-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setSignedness('unsigned')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${signedness === 'unsigned' ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Unsigned
                                    </button>
                                    <button
                                        onClick={() => setSignedness('signed')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${signedness === 'signed' ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Signed (2's Comp)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Memory Tape */}
                <div className="bg-slate-800 p-6 rounded-2xl shadow-sm text-white">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Info size={16} /> Memory Layout (Raw Bytes)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {bytes.memory.map((b, i) => {
                            const isActive = i < bytes.activeCount;
                            return (
                                <div key={i} className={`p-4 rounded-xl border ${isActive ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 border-slate-700 opacity-50'} flex flex-col items-center relative`}>
                                    <span className="absolute top-2 left-2 text-xs font-mono text-slate-400">[{i}]</span>
                                    <span className="text-3xl font-mono font-bold mt-2 text-indigo-300">
                                        {b.toString(16).padStart(2, '0').toUpperCase()}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400 mt-2 tracking-widest">
                                        {b.toString(2).padStart(8, '0')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">

                    {/* 16-bit Pairs - Highlighted per prompt requirements */}
                    <div className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-indigo-900">16-bit Words (Calculated per Pair)</h2>
                            <span className="text-xs font-medium bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">Primary</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                            {/* Pair 1 */}
                            <div className="p-6 relative">
                                <h3 className="text-sm font-semibold text-slate-500 mb-4">Pair 1 (Bytes [0] & [1])</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex bg-slate-100 p-2 rounded-lg font-mono text-sm text-slate-600">
                                        <span className={endianness === 'big' ? 'font-bold text-indigo-600' : ''}>
                                            {bytes.memory[0].toString(16).padStart(2, '0').toUpperCase()}
                                        </span>
                                        <ArrowRightLeft size={14} className="mx-2 text-slate-400" />
                                        <span className={endianness === 'little' ? 'font-bold text-indigo-600' : ''}>
                                            {bytes.memory[1].toString(16).padStart(2, '0').toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                        Hex: 0x{calculations.w0Hex}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-slate-800 font-mono tracking-tight">
                                    {calculations.w0.toLocaleString()}
                                </div>
                            </div>

                            {/* Pair 2 */}
                            <div className="p-6 relative">
                                <h3 className="text-sm font-semibold text-slate-500 mb-4">Pair 2 (Bytes [2] & [3])</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex bg-slate-100 p-2 rounded-lg font-mono text-sm text-slate-600">
                                        <span className={endianness === 'big' ? 'font-bold text-indigo-600' : ''}>
                                            {bytes.memory[2].toString(16).padStart(2, '0').toUpperCase()}
                                        </span>
                                        <ArrowRightLeft size={14} className="mx-2 text-slate-400" />
                                        <span className={endianness === 'little' ? 'font-bold text-indigo-600' : ''}>
                                            {bytes.memory[3].toString(16).padStart(2, '0').toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                        Hex: 0x{calculations.w1Hex}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-slate-800 font-mono tracking-tight">
                                    {calculations.w1.toLocaleString()}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 32-bit integer */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-md font-bold text-slate-800 mb-4">32-bit Integer (Full View)</h2>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 w-fit">
                                    Hex: 0x{calculations.dwordHex}
                                </span>
                                <div className="text-3xl font-bold text-slate-800 font-mono mt-2">
                                    {calculations.dword.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* 8-bit integers */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-md font-bold text-slate-800 mb-4">8-bit Integers (Individual)</h2>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {calculations.b.map((val, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-1">
                                        <span className="text-xs text-slate-500 font-mono">Byte [{i}]</span>
                                        <span className="font-mono font-semibold text-slate-700">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}