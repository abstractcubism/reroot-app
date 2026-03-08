import { Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquareMore,
  Plus,
  Receipt,
  Wrench,
} from "lucide-react";

const billItems = [
  { label: "March Rent", amount: "$2,640", due: "Mar 12", status: "2/3 paid" },
  { label: "PSEG Electric", amount: "$128", due: "Mar 14", status: "1/3 paid" },
  { label: "Xfinity WiFi", amount: "$72", due: "Mar 16", status: "0/3 paid" },
];

const maintenanceItems = [
  { issue: "Kitchen faucet leak", submitted: "Mar 5", status: "In progress", priority: "Medium" },
  { issue: "Bedroom heater noise", submitted: "Mar 3", status: "Landlord contacted", priority: "High" },
  { issue: "Hallway light replacement", submitted: "Mar 1", status: "Scheduled", priority: "Low" },
];

const agreementChecklist = [
  "Quiet hours confirmed",
  "Cleaning schedule assigned",
  "Guest policy signed",
  "Shared supplies budget set",
  "Move-out notice terms added",
];

const landlordContacts = [
  { name: "Evergreen Property Group", role: "Property Manager", method: "Call", value: "(732) 555-0194" },
  { name: "Jordan Patel", role: "Maintenance Coordinator", method: "Email", value: "maint@evergreenpm.com" },
];

export function GreenhousePreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100/30">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Demo Preview</p>
            <h1 className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">Greenhouse Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">This is the unlocked premium workspace students see after joining.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/greenhouse"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Back to plan
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add expense
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Receipt className="h-4 w-4 text-emerald-700" />
                  Bill Tracker
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">Next due: Mar 12</span>
              </div>
              <div className="space-y-2">
                {billItems.map((bill) => (
                  <div key={bill.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bill.label}</p>
                      <p className="text-xs text-gray-500">Due {bill.due}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{bill.amount}</p>
                    <p className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">{bill.status}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Wrench className="h-4 w-4 text-emerald-700" />
                  Maintenance Requests
                </h2>
                <button type="button" className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50">
                  New request
                </button>
              </div>
              <div className="space-y-2">
                {maintenanceItems.map((ticket) => (
                  <div key={ticket.issue} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ticket.issue}</p>
                        <p className="mt-0.5 text-xs text-gray-500">Submitted {ticket.submitted}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100">{ticket.status}</span>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      Priority: {ticket.priority}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="space-y-5">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                Roommate Agreement
              </h2>
              <p className="mt-1 text-xs text-gray-500">4 of 5 sections completed</p>
              <div className="mt-3 space-y-2">
                {agreementChecklist.map((item, index) => (
                  <div key={item} className="inline-flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${index === agreementChecklist.length - 1 ? "text-emerald-500/50" : "text-emerald-700"}`} />
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MessageSquareMore className="h-4 w-4 text-emerald-700" />
                Landlord Contact Hub
              </h2>
              <div className="mt-3 space-y-2">
                {landlordContacts.map((contact) => (
                  <div key={contact.name} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-800">
                      {contact.method}: {contact.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <FileText className="h-4 w-4" />
                Weekly Recap
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                2 bills were marked paid, 1 maintenance issue moved to scheduled, and your roommate agreement has one section left to sign.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
