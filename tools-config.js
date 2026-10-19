/**
 * ReportEdge Voice Concierge — Tool Configuration
 * -------------------------------------------------
 * Edit this file to add/change tools, summaries, spoken examples,
 * and the page URL the agent should navigate to when a tool is picked.
 *
 * "match" is a list of words/phrases the voice/text recognizer will listen
 * for to detect which tool the user asked for. Keep them short and distinct.
 */

const REPORTEDGE_TOOLS = {
  individual: {
    label: "Individual",
    introLine:
      "As an individual, here's what I can help you with. We have the ITR Preview, the Dual Job Tax Checker, the Advance Tax Calculator, the Capital Gains Tax tool, and the Financial Health Dashboard.",
    tools: [
      {
        id: "itr",
        name: "ITR Preview",
        match: ["itr", "itr preview", "income tax", "form 16", "form-16"],
        summary:
          "Upload your Form-16 and get an instant income tax summary — no manual entry needed. It compares the old and new tax regimes and shows your exact refund or tax due.",
        example:
          "For example, say you're a salaried employee earning around nine lakh rupees a year. Upload your Form-16, and in about two minutes you'll see which tax regime saves you more money, and whether you're due a refund.",
        url: "itr.html",
      },
      {
        id: "dualjob",
        name: "Dual Job Tax Checker",
        match: ["dual job", "two jobs", "freelance", "second job", "dual job tax"],
        summary:
          "If you have two employers, or a job plus freelance income, this tool shows your combined tax for the year, how much extra tax is due compared to each income being taxed separately, and your advance tax due dates.",
        example:
          "For example, imagine you work a full-time job and also freelance on the side. This tool combines both incomes, shows the real tax impact, and tells you exactly when your advance tax payments are due.",
        url: "dual-job-tax-checker.html",
      },
      {
        id: "advancetax",
        name: "Advance Tax Calculator",
        match: ["advance tax", "advance tax calculator", "quarterly tax"],
        summary:
          "If you switched jobs, freelance on the side, or sold shares or property, this calculates your quarterly advance tax, the due dates, and any interest you might owe under Section 234B or 234C.",
        example:
          "For example, say you sold some shares this year and made a profit. This tool works out how much advance tax you owe on that profit, which quarter it's due in, and the penalty interest if you pay late.",
        url: "advancetaxcalculator.html",
      },
      {
        id: "capitalgains",
        name: "Capital Gains Tax",
        match: ["capital gains", "property tax", "sold property", "ltcg", "stcg"],
        summary:
          "If you sold a house, plot, land, or commercial property, this gives an instant long-term or short-term capital gains breakdown, with indexation, and relevant exemptions under Sections 54, 54F, 54B, and 54EC.",
        example:
          "For example, say you sold a flat you'd owned for six years. This tool calculates your long-term capital gain with indexation, and shows how much tax you'd save by reinvesting under Section 54.",
        url: "capital-gains.html",
      },
      {
        id: "financialhealth",
        name: "Financial Health Dashboard",
        match: ["financial health", "dashboard", "net worth", "loans", "emi"],
        summary:
          "This tracks your monthly surplus, loans and EMI schedules, credit cards, assets, and overall net worth in one place, with a health score and downloadable PDF reports.",
        example:
          "For example, if you've got a home loan, a couple of credit cards, and some savings, this dashboard pulls it all together into one health score, so you always know where you stand financially.",
        url: "financial-health.html",
      },
    ],
  },

  company: {
    label: "Company",
    introLine:
      "As a company, here's what I can help you with. We have the Virtual CFO suite for real estate brokers, IFRS Financials from Trial Balance, and GST Reconciliation.",
    tools: [
      {
        id: "virtualcfo",
        name: "Virtual CFO for Real Estate Brokers",
        match: ["virtual cfo", "real estate", "brokers", "cfo"],
        summary:
          "Log your deals and expenses and get a full brokerage CFO suite — commission waterfalls, agent and team performance, marketing ROI, VAT summary, AML flags, receivables aging, and a boardroom-ready report.",
        example:
          "For example, say you run a brokerage with ten agents. This tool shows you exactly which agent and which marketing channel is bringing in the most profitable deals, not just the most deals.",
        url: "virtual-cfo-realestate.html",
      },
      {
        id: "ifrs",
        name: "IFRS Financials from Trial Balance",
        match: ["ifrs", "trial balance", "financial statements", "balance sheet"],
        summary:
          "Paste or upload your classified Trial Balance and instantly generate a full IFRS Balance Sheet, Profit and Loss, Cash Flow Statement, and Notes, right in your browser.",
        example:
          "For example, instead of rebuilding pivot tables every time a client sends a new trial balance, you paste it in once and get a complete, formatted financial statement set in minutes.",
        url: "ifrs-financials.html",
      },
      {
        id: "gst",
        name: "GST Reconciliation",
        match: ["gst", "reconciliation", "gstr", "gstr-2b", "gstr 2b"],
        summary:
          "Paste or upload your books and your GSTR-2B data, and instantly get every invoice matched, with every mismatch categorized by GSTIN, invoice number, date, and value.",
        example:
          "For example, instead of manually cross-checking two hundred invoices in a spreadsheet every month, this matches them automatically and flags exactly which ones don't line up.",
        url: "gst-reconciliation.html",
      },
    ],
  },
};

// Make available to the widget script
if (typeof module !== "undefined" && module.exports) {
  module.exports = REPORTEDGE_TOOLS;
}
