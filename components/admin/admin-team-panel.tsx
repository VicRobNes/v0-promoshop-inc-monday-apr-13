"use client"

import { useEffect, useState } from "react"
import { Trash2, Plus, Save, RotateCcw } from "lucide-react"
import { TEAM_MEMBERS, type TeamMember } from "@/lib/cms/team"
import {
  clearTeamOverride,
  readTeamOverride,
  writeTeamOverride,
} from "@/lib/admin-overrides"

// Admin panel for team-member CRUD (client feedback Apr 16: "Can I have the
// ability to add and remove team members, change their names and titles?").
// Backed by localStorage today; persists to Cosmos in a follow-up phase.

const EMPTY_MEMBER: TeamMember = {
  name: "",
  role: "",
  description: "",
  imagePath: "",
}

export function AdminTeamPanel() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [draft, setDraft] = useState<TeamMember>(EMPTY_MEMBER)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const initial = readTeamOverride() ?? TEAM_MEMBERS
    setMembers(initial)
  }, [])

  const update = (next: TeamMember[]) => {
    setMembers(next)
    setDirty(true)
    setSaved(false)
  }

  const handleAdd = () => {
    if (!draft.name.trim() || !draft.role.trim()) return
    update([...members, { ...draft }])
    setDraft(EMPTY_MEMBER)
  }

  const handleRemove = (index: number) => {
    update(members.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, patch: Partial<TeamMember>) => {
    update(members.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const handleSave = () => {
    writeTeamOverride(members)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    clearTeamOverride()
    setMembers(TEAM_MEMBERS)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111]">Team members</h2>
          <p className="text-sm text-[#666]">
            Add, remove, and edit the roster shown on /about. Changes save
            locally and appear live on the public site in this browser.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666] border border-[#d4d4d4] rounded hover:bg-[#f6f6f6]"
            title="Reset to built-in roster"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              dirty
                ? "bg-[#ea4a3f] text-white hover:bg-[#d93e36]"
                : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member, i) => (
          <div
            key={i}
            className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <input
                type="text"
                value={member.name}
                onChange={(e) => handleChange(i, { name: e.target.value })}
                placeholder="Name"
                className="flex-1 font-bold text-sm text-[#111] bg-transparent border-b border-[#e5e5e5] py-1 focus:border-[#ea4a3f] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label="Remove team member"
                className="text-[#999] hover:text-[#ea4a3f]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={member.role}
              onChange={(e) => handleChange(i, { role: e.target.value })}
              placeholder="Role / title"
              className="w-full text-xs text-[#ea4a3f] font-bold uppercase tracking-wider bg-transparent border-b border-[#e5e5e5] py-1 focus:border-[#ea4a3f] focus:outline-none"
            />
            <textarea
              value={member.description}
              onChange={(e) => handleChange(i, { description: e.target.value })}
              placeholder="One-line bio"
              rows={2}
              className="w-full text-xs text-[#666] bg-transparent border border-[#e5e5e5] rounded p-2 focus:border-[#ea4a3f] focus:outline-none resize-none"
            />
            <input
              type="text"
              value={member.imagePath ?? ""}
              onChange={(e) => handleChange(i, { imagePath: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full text-xs text-[#666] bg-transparent border border-[#e5e5e5] rounded px-2 py-1.5 focus:border-[#ea4a3f] focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-[#f9f9f9] border border-dashed border-[#d4d4d4] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#111] mb-3">Add a team member</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Name"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            placeholder="Role / title"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Bio"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.imagePath ?? ""}
            onChange={(e) => setDraft({ ...draft, imagePath: e.target.value })}
            placeholder="Image URL (optional)"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.name.trim() || !draft.role.trim()}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" /> Add member
        </button>
      </div>
    </div>
  )
}
