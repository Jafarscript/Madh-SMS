/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import {
  X,
  Upload,
  Palette,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Spinner from "./Spinner";

interface ReportCardTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ReportCardTemplateModal: React.FC<ReportCardTemplateModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [schoolNameArabic, setSchoolNameArabic] = useState(
    "معهد التعليم العربي الإسلامي"
  );
  const [schoolNameEnglish, setSchoolNameEnglish] = useState(
    "INSTITUTE OF ARABIC AND ISLAMIC STUDIES"
  );
  const [address, setAddress] = useState(
    "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665"
  );
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [headerColor, setHeaderColor] = useState("#1e3a8a");
  const [logoBase64, setLogoBase64] = useState("");
  const [showPrincipalSignature, setShowPrincipalSignature] = useState(false);
  const [principalSignatureBase64, setPrincipalSignatureBase64] = useState("");
  const [showStamp, setShowStamp] = useState(false);
  const [stampBase64, setStampBase64] = useState("");
  const [watermarkText, setWatermarkText] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/report-card-settings");
      if (res.data) {
        if (res.data.schoolNameArabic)
          setSchoolNameArabic(res.data.schoolNameArabic);
        if (res.data.schoolNameEnglish)
          setSchoolNameEnglish(res.data.schoolNameEnglish);
        if (res.data.address) setAddress(res.data.address);
        if (res.data.primaryColor) setPrimaryColor(res.data.primaryColor);
        if (res.data.headerColor) setHeaderColor(res.data.headerColor);
        if (res.data.logoBase64) setLogoBase64(res.data.logoBase64);
        setShowPrincipalSignature(Boolean(res.data.showPrincipalSignature));
        if (res.data.principalSignatureBase64)
          setPrincipalSignatureBase64(res.data.principalSignatureBase64);
        setShowStamp(Boolean(res.data.showStamp));
        if (res.data.stampBase64) setStampBase64(res.data.stampBase64);
        if (res.data.watermarkText) setWatermarkText(res.data.watermarkText);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, SVG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should not exceed 5MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaults = () => {
    setSchoolNameArabic("معهد التعليم العربي الإسلامي");
    setSchoolNameEnglish("INSTITUTE OF ARABIC AND ISLAMIC STUDIES");
    setAddress(
      "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665"
    );
    setPrimaryColor("#16a34a");
    setHeaderColor("#1e3a8a");
    setLogoBase64("");
    setShowPrincipalSignature(false);
    setPrincipalSignatureBase64("");
    setShowStamp(false);
    setStampBase64("");
    setWatermarkText("");
    setSuccess("Reset to standard defaults. Click 'Save Template' to apply.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/report-card-settings", {
        schoolNameArabic,
        schoolNameEnglish,
        address,
        primaryColor,
        headerColor,
        logoBase64,
        showPrincipalSignature,
        principalSignatureBase64,
        showStamp,
        stampBase64,
        watermarkText,
      });

      setSuccess("Report card template saved successfully!");
      onSaved();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save template settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Report Card Template & Branding Design
              </h2>
              <p className="text-xs text-gray-500">
                Customize header typography, official colors, logo, and signatures for A4 report cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-sky-700 text-sm rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Spinner />
              <p className="text-sm">Loading template settings...</p>
            </div>
          ) : (
            <form id="template-form" onSubmit={handleSave} className="space-y-6">
              {/* School Names & Typography */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Building className="w-4 h-4 text-sky-600" />
                  <span>School Header Information</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      School Name in Arabic (اسم المعهد باللغة العربية)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={schoolNameArabic}
                      onChange={(e) => setSchoolNameArabic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                      style={{ fontFamily: "Amiri, serif" }}
                      placeholder="معهد التعليم العربي الإسلامي"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      School Name in English
                    </label>
                    <input
                      type="text"
                      value={schoolNameEnglish}
                      onChange={(e) => setSchoolNameEnglish(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium uppercase focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                      placeholder="INSTITUTE OF ARABIC AND ISLAMIC STUDIES"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Official Address & Contact Line (Multi-line supported)
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,&#10;49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665"
                  />
                </div>
              </div>

              {/* Theme Colors */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Palette className="w-4 h-4 text-sky-600" />
                  <span>Color Palette & Theme Accents</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800">
                        Primary Border Color
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Outer A4 frame border & accents
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5"
                      />
                      <span className="text-xs font-mono text-gray-600">{primaryColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800">
                        Header & Title Color
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Arabic school title & report banner
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerColor}
                        onChange={(e) => setHeaderColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5"
                      />
                      <span className="text-xs font-mono text-gray-600">{headerColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo & Visual Assets */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>School Logo & Badges</span>
                  </div>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64("")}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Custom Logo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {logoBase64 ? (
                      <img
                        src={logoBase64}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Default</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 font-semibold text-xs rounded-xl cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Upload New Logo (PNG / JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setLogoBase64)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Transparent PNG or JPG up to 5MB. Rendered in the top right corner of the report card.
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures & Stamp Uploads */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="text-sm font-semibold text-gray-800">
                  Principal Signature & Official Stamp
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Signature */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPrincipalSignature}
                          onChange={(e) => setShowPrincipalSignature(e.target.checked)}
                          className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Show Principal Signature</span>
                      </label>
                      {principalSignatureBase64 && (
                        <button
                          type="button"
                          onClick={() => setPrincipalSignatureBase64("")}
                          className="text-[11px] text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="h-14 border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {principalSignatureBase64 ? (
                        <img
                          src={principalSignatureBase64}
                          alt="Signature Preview"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-gray-400">No signature image uploaded</span>
                      )}
                    </div>

                    <label className="block text-center py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium cursor-pointer transition-colors">
                      Choose Signature Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setPrincipalSignatureBase64)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Stamp */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showStamp}
                          onChange={(e) => setShowStamp(e.target.checked)}
                          className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Show Official Stamp</span>
                      </label>
                      {stampBase64 && (
                        <button
                          type="button"
                          onClick={() => setStampBase64("")}
                          className="text-[11px] text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="h-14 border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {stampBase64 ? (
                        <img
                          src={stampBase64}
                          alt="Stamp Preview"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-gray-400">No stamp image uploaded</span>
                      )}
                    </div>

                    <label className="block text-center py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium cursor-pointer transition-colors">
                      Choose Stamp Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setStampBase64)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200/70 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="template-form"
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-md shadow-sky-600/20 active:scale-[0.99] transition-all"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving Template...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Template Design</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardTemplateModal;
