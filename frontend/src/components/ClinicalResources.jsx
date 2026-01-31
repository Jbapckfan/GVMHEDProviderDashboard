import './ClinicalResources.css'

const RESOURCE_CATEGORIES = [
  {
    name: 'Calculators',
    icon: '\u{1F9EE}',
    links: [
      { title: 'MDCalc Home', url: 'https://www.mdcalc.com/', desc: 'Evidence-based clinical calculators' },
      { title: 'HEART Score', url: 'https://www.mdcalc.com/calc/1752/heart-score-major-cardiac-events', desc: 'Major cardiac events risk' },
      { title: 'Wells PE', url: 'https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism', desc: 'PE probability scoring' },
      { title: 'PERC Rule', url: 'https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism', desc: 'Rule out PE without D-dimer' },
      { title: 'CHA2DS2-VASc', url: 'https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk', desc: 'AFib stroke risk' },
      { title: 'CURB-65', url: 'https://www.mdcalc.com/calc/324/curb-65-score-pneumonia-severity', desc: 'Pneumonia severity' },
      { title: 'Ottawa Ankle', url: 'https://www.mdcalc.com/calc/1670/ottawa-ankle-rule', desc: 'Ankle x-ray decision rule' },
      { title: 'Canadian C-Spine', url: 'https://www.mdcalc.com/calc/696/canadian-c-spine-rule', desc: 'C-spine imaging decision' },
      { title: 'NEXUS C-Spine', url: 'https://www.mdcalc.com/calc/696/canadian-c-spine-rule', desc: 'C-spine clearance criteria' },
      { title: 'GCS Calculator', url: 'https://www.mdcalc.com/calc/64/glasgow-coma-scale-score-gcs', desc: 'Glasgow Coma Scale' },
      { title: 'NIH Stroke Scale', url: 'https://www.mdcalc.com/calc/715/nih-stroke-scale-score-nihss', desc: 'Stroke severity scoring' },
      { title: 'PECARN Head CT', url: 'https://www.mdcalc.com/calc/589/pecarn-pediatric-head-injury-trauma-algorithm', desc: 'Pediatric head injury decision' },
    ]
  },
  {
    name: 'Legal / Psychiatric',
    icon: '\u{1F4CB}',
    links: [
      { title: 'MO 96-Hour Hold Form (Pre-filled)', url: '/mo-96hr-hold.pdf', desc: 'DMH 142 — GVMH address pre-filled, editable PDF' },
    ]
  },
  {
    name: 'Drug References',
    icon: '\u{1F48A}',
    links: [
      { title: 'UpToDate', url: 'https://www.uptodate.com/', desc: 'Evidence-based clinical resource' },
      { title: 'Epocrates', url: 'https://www.epocrates.com/', desc: 'Drug interactions & dosing' },
    ]
  },
]

function ClinicalResources() {
  return (
    <div className="card clinical-resources-card">
      <div className="card-header">
        <h2 className="card-title">{'\u{1F4D6}'} Clinical Resources</h2>
      </div>

      <div className="resources-categories">
        {RESOURCE_CATEGORIES.map((category) => (
          <div key={category.name} className="resource-category">
            <h3 className="category-header">
              <span className="category-icon">{category.icon}</span>
              {category.name}
            </h3>
            <div className="resource-links">
              {category.links.map((link, idx) => (
                link.placeholder ? (
                  <div key={idx} className="resource-link resource-link-placeholder" title="Link will be provided">
                    <span className="link-title">{link.title}</span>
                    <span className="link-desc">{link.desc}</span>
                    <span className="link-pending">Link pending</span>
                  </div>
                ) : (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    <span className="link-title">{link.title}</span>
                    <span className="link-desc">{link.desc}</span>
                    <span className="link-arrow">{'\u2197'}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClinicalResources
