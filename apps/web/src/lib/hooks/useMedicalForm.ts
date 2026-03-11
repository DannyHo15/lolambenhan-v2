import { useState, useCallback, useEffect, useRef } from "react";
import { calculateAge, calculateBMI, getBMIClassification } from "../utils/calculations";
import type { FormData } from "../utils/docx-export";

const DEFAULT_TIENSU = `a) Bản thân:
  - Nội khoa: Không THA, ĐTĐ2
  - Ngoại khoa: Chưa từng phẫu thuật
  - Thói quen: Không thuốc lá rượu bia
  - Không tiền sử dị ứng thuốc, thức ăn
b) Gia đình: Không ghi nhận bệnh lý liên quan`;

const DEFAULT_CLS_THUONGQUY =
  "CTM; TPTNT; glucose máu; định lượng AST, ALT, ure, creatinin huyết thanh; eGFR; ion đồ 3 thông số; ECG";

const DEFAULT_COQUANKHAC = "Không phát hiện bất thường";

const DEFAULT_TONGTRANG = `- Bệnh tỉnh, tiếp xúc tốt
- Da niêm hồng, chi ấm, mạch rõ
- Không phù, không dấu xuất huyết
- Tuyến giáp không to
- Hạch ngoại vi không sờ chạm`;

interface UseMedicalFormOptions {
  /**
   * Unique key for localStorage persistence
   * Set to undefined to disable auto-save
   */
  persistenceKey?: string
  /**
   * Debounce delay in milliseconds before saving
   * @default 500
   */
  debounceMs?: number
}

// Get or create session ID for this tab (persists across reload)
const getSessionId = (persistenceKey: string) => {
  // Check if running on client side
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null
  }
  const storageKey = `benhan:sessionId:${persistenceKey}`
  let sessionId = sessionStorage.getItem(storageKey)
  if (!sessionId) {
    sessionId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem(storageKey, sessionId)
  }
  return sessionId
}

export function useMedicalForm(options: UseMedicalFormOptions = {}) {
  const { persistenceKey, debounceMs = 500 } = options

  // Unique session ID for this tab (persists across reloads)
  const sessionId = persistenceKey ? getSessionId(persistenceKey) : null

  // Build the full storage key with session ID
  const storageKey = persistenceKey ? `benhan:${persistenceKey}:${sessionId}` : null

  // User-added content for tomtat (persists separately)
  const [tomtatUser, setTomtatUser] = useState("")

  // Initialize form data from localStorage if persistence is enabled
  const [formData, setFormData] = useState<Partial<FormData>>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Restore tomtatUser if exists
          if (parsed.tomtatUser) {
            setTomtatUser(parsed.tomtatUser)
          }
          return {
            tiensu: DEFAULT_TIENSU,
            cls_thuongquy: DEFAULT_CLS_THUONGQUY,
            coquankhac: DEFAULT_COQUANKHAC,
            tongtrang: DEFAULT_TONGTRANG,
            ...parsed,
          }
        }
      } catch {
        // Ignore parse errors, use defaults
      }
    }
    return {
      tiensu: DEFAULT_TIENSU,
      cls_thuongquy: DEFAULT_CLS_THUONGQUY,
      coquankhac: DEFAULT_COQUANKHAC,
      tongtrang: DEFAULT_TONGTRANG,
    }
  })

  const [calculated, setCalculated] = useState({
    tuoi: "-",
    bmi: "-",
    phanloai: "-",
  })

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!storageKey) return

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Include tomtatUser in saved data
        const dataToSave = { ...formData, tomtatUser }
        localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        setLastSaved(new Date())
      } catch {
        // Ignore save errors
      }
    }, debounceMs)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, tomtatUser, storageKey, debounceMs])

  // Get combined tomtat (auto-generated + user-added)
  const getTomtatCombined = useCallback(() => {
    const gioitinh = formData.gioitinh?.toLowerCase() || ""
    const tuoi = calculated.tuoi || "-"
    const lydo = formData.lydo?.toLowerCase() || ""

    const autoPart = `Bệnh nhân ${gioitinh} ${tuoi} tuổi vào viện vì ${lydo}. Qua hỏi bệnh, khám bệnh ghi nhận:\n`
    return tomtatUser ? `${autoPart}${tomtatUser}` : autoPart
  }, [formData.gioitinh, calculated.tuoi, formData.lydo, tomtatUser])

  // Update form field
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Calculate age when birth year changes
  useEffect(() => {
    if (formData.namsinh) {
      const year = parseInt(formData.namsinh)
      if (!isNaN(year) && year > 1900 && year < 2100) {
        const age = calculateAge(year)
        setCalculated((prev) => ({ ...prev, tuoi: String(age) }))
      } else {
        setCalculated((prev) => ({ ...prev, tuoi: "-" }))
      }
    }
  }, [formData.namsinh])

  // Calculate BMI when height or weight changes
  useEffect(() => {
    const height = parseFloat(formData.chieucao || "")
    const weight = parseFloat(formData.cannang || "")

    if (!isNaN(height) && !isNaN(weight) && height > 0) {
      const bmi = calculateBMI(height, weight)
      setCalculated({
        ...calculated,
        bmi: bmi.toFixed(1),
        phanloai: getBMIClassification(bmi),
      })
    } else {
      setCalculated({
        ...calculated,
        bmi: "-",
        phanloai: "-",
      })
    }
  }, [formData.chieucao, formData.cannang])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      tiensu: DEFAULT_TIENSU,
      cls_thuongquy: DEFAULT_CLS_THUONGQUY,
      coquankhac: DEFAULT_COQUANKHAC,
      tongtrang: DEFAULT_TONGTRANG,
    })
    setCalculated({ tuoi: "-", bmi: "-", phanloai: "-" })
    setTomtatUser("")
  }, [])

  // Clear saved data (call after successful export)
  const clearSaved = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ignore errors
      }
    }
  }, [storageKey])

  // Get complete form data for export
  const getExportData = useCallback((): FormData => {
    return {
      hoten: formData.hoten || "",
      gioitinh: formData.gioitinh || "",
      namsinh: formData.namsinh || "",
      tuoi: calculated.tuoi,
      dantoc: formData.dantoc || "",
      nghenghiep: formData.nghenghiep || "",
      diachi: formData.diachi || "",
      ngaygio: formData.ngaygio || "",
      lydo: formData.lydo || "",
      benhsu: formData.benhsu || "",
      tiensu: formData.tiensu || DEFAULT_TIENSU,
      mach: formData.mach || "",
      nhietdo: formData.nhietdo || "",
      ha_tren: formData.ha_tren || "",
      ha_duoi: formData.ha_duoi || "",
      nhiptho: formData.nhiptho || "",
      chieucao: formData.chieucao || "",
      cannang: formData.cannang || "",
      bmi: calculated.bmi,
      phanloai: calculated.phanloai,
      tongtrang: formData.tongtrang || DEFAULT_TONGTRANG,
      timmach: formData.timmach || "",
      hopho: formData.hopho || "",
      tieuhoa: formData.tieuhoa || "",
      than: formData.than || "",
      thankinh: formData.thankinh || "",
      cokhop: formData.cokhop || "",
      coquankhac: formData.coquankhac || DEFAULT_COQUANKHAC,
      tomtat: getTomtatCombined(),
      chandoanso: formData.chandoanso || "",
      chandoanpd: formData.chandoanpd || "",
      cls_thuongquy: formData.cls_thuongquy || DEFAULT_CLS_THUONGQUY,
      cls_chuandoan: formData.cls_chuandoan || "",
      ketqua: formData.ketqua || "",
      chandoanxacdinh: formData.chandoanxacdinh || "",
      huongdieutri: formData.huongdieutri || "",
      dieutri: formData.dieutri || "",
      tienluong: formData.tienluong || "",
      bienluan: formData.bienluan || "",
    }
  }, [formData, calculated, getTomtatCombined])

  return {
    formData,
    calculated,
    updateField,
    resetForm,
    getExportData,
    lastSaved,
    clearSaved,
    tomtatCombined: getTomtatCombined(),
    setTomtatUser,
  }
}
