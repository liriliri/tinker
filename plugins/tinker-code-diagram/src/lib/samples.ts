interface SampleDiagram {
  id: string
  name: string
  title: string
  code: string
}

/** Default examples from @mermaid-js/examples (one per diagram type). */
export const SAMPLE_DIAGRAMS: SampleDiagram[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    title: 'Basic Flowchart',
    code: 'flowchart TD\n    A[Christmas] -->|Get money| B(Go shopping)\n    B --> C{Let me think}\n    C -->|One| D[Laptop]\n    C -->|Two| E[iPhone]\n    C -->|Three| F[fa:fa-car Car]\n',
  },
  {
    id: 'class',
    name: 'Class',
    title: 'Basic Class Inheritance',
    code: 'classDiagram\n    Animal <|-- Duck\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()\n    class Duck{\n      +String beakColor\n      +swim()\n      +quack()\n    }\n    class Fish{\n      -int sizeInFeet\n      -canEat()\n    }\n    class Zebra{\n      +bool is_wild\n      +run()\n    }\n',
  },
  {
    id: 'sequence',
    name: 'Sequence',
    title: 'Basic Sequence',
    code: 'sequenceDiagram\n    Alice->>+John: Hello John, how are you?\n    Alice->>+John: John, can you hear me?\n    John-->>-Alice: Hi Alice, I can hear you!\n    John-->>-Alice: I feel great!\n',
  },
  {
    id: 'entity-relationship',
    name: 'Entity Relationship',
    title: 'Basic ER Schema',
    code: 'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ ORDER_ITEM : contains\n    PRODUCT ||--o{ ORDER_ITEM : includes\n    CUSTOMER {\n        string id\n        string name\n        string email\n    }\n    ORDER {\n        string id\n        date orderDate\n        string status\n    }\n    PRODUCT {\n        string id\n        string name\n        float price\n    }\n    ORDER_ITEM {\n        int quantity\n        float price\n    }\n',
  },
  {
    id: 'state',
    name: 'State',
    title: 'Basic State Diagram',
    code: 'stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]\n',
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    title: 'Basic Mindmap',
    code: 'mindmap\n  root((mindmap))\n    Origins\n      Long history\n      ::icon(fa fa-book)\n      Popularisation\n        British popular psychology author Tony Buzan\n    Research\n      On effectiveness<br/>and features\n      On Automatic creation\n        Uses\n            Creative techniques\n            Strategic planning\n            Argument mapping\n    Tools\n      Pen and paper\n      Mermaid\n',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    title: 'Basic System Architecture',
    code: 'architecture-beta\n    group api(cloud)[API]\n\n    service db(database)[Database] in api\n    service disk1(disk)[Storage] in api\n    service disk2(disk)[Storage] in api\n    service server(server)[Server] in api\n\n    db:L -- R:server\n    disk1:T -- B:server\n    disk2:T -- B:db\n',
  },
  {
    id: 'block',
    name: 'Block',
    title: 'Three-Tier Web Architecture',
    code: 'block-beta\n  columns 3\n  user(("User")):3\n  space:3\n  ui["Web UI"] api["API Server"] db[("Database")]\n\n  user --> ui\n  ui --> api\n  api --> db\n\n  style user fill:#ffe0b2,stroke:#fb8c00\n  style db fill:#bbdefb,stroke:#1e88e5\n',
  },
  {
    id: 'c4',
    name: 'C4',
    title: 'Internet Banking System Context',
    code: 'C4Context\n    title System Context diagram for Internet Banking System\n    Enterprise_Boundary(b0, "BankBoundary0") {\n        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")\n        Person(customerB, "Banking Customer B")\n        Person_Ext(customerC, "Banking Customer C", "desc")\n\n        Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")\n\n        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")\n\n        Enterprise_Boundary(b1, "BankBoundary") {\n            SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")\n\n            System_Boundary(b2, "BankBoundary2") {\n                System(SystemA, "Banking System A")\n                System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")\n            }\n\n            System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")\n            SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")\n\n            Boundary(b3, "BankBoundary3", "boundary") {\n                SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")\n                SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")\n            }\n        }\n    }\n\n    BiRel(customerA, SystemAA, "Uses")\n    BiRel(SystemAA, SystemE, "Uses")\n    Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")\n    Rel(SystemC, customerA, "Sends e-mails to")\n',
  },
  {
    id: 'cynefin-framework',
    name: 'Cynefin Framework',
    title: 'Incident Response',
    code: 'cynefin-beta\n  title Incident Response\n\n  complex\n    "Investigate root cause"\n    "Run chaos experiment"\n\n  complicated\n    "Analyze performance data"\n    "Expert review needed"\n\n  clear\n    "Restart service"\n    "Apply known fix"\n\n  chaotic\n    "Page on-call immediately"\n\n  confusion\n    "Unknown failure mode"\n\n  complex --> complicated : "Pattern identified"\n  clear --> chaotic : "Complacency"\n',
  },
  {
    id: 'event-modeling',
    name: 'Event Modeling',
    title: 'Shopping Cart Story',
    code: 'eventmodeling\n\ntf 01 ui ShopUI\ntf 02 cmd AddItemToCart\ntf 03 evt ItemAdded\ntf 04 rmo CartView ->> 03\ntf 05 ui CheckoutUI\ntf 06 cmd PlaceOrder\ntf 07 evt OrderPlaced\ntf 08 rmo OrderStatus ->> 07\n',
  },
  {
    id: 'gantt',
    name: 'Gantt',
    title: 'Product Launch Plan',
    code: 'gantt\n    title Product Launch Plan\n    dateFormat YYYY-MM-DD\n    section Planning\n        Market research      :done, research, 2024-03-01, 10d\n        Define requirements  :done, reqs, after research, 7d\n    section Build\n        Design prototype     :active, proto, after reqs, 14d\n        User testing         :testing, after proto, 7d\n    section Launch\n        Marketing campaign   :marketing, after proto, 14d\n        Release day          :milestone, after testing, 0d\n',
  },
  {
    id: 'git',
    name: 'Git',
    title: 'Basic Git Flow',
    code: 'gitGraph\n    commit id: "a3f82c1"\n    branch develop\n    checkout develop\n    commit id: "b7e41d9"\n    commit id: "c9d52e4"\n    checkout main\n    merge develop id: "d4e8f3a"\n    commit id: "e1b6c90"\n    branch feature\n    checkout feature\n    commit id: "f2a8d17"\n    commit id: "a8c3f54"\n    checkout main\n    merge feature id: "b9d7e21"\n',
  },
  {
    id: 'ishikawa',
    name: 'Ishikawa',
    title: 'Ishikawa Diagram',
    code: 'ishikawa-beta\n    Blurry Photo\n    Process\n        Out of focus\n        Shutter speed too slow\n        Protective film not removed\n        Beautification filter applied\n    User\n        Shaky hands\n    Equipment\n        LENS\n            Inappropriate lens\n            Damaged lens\n            Dirty lens\n        SENSOR\n            Damaged sensor\n            Dirty sensor\n    Environment\n        Subject moved too quickly\n        Too dark\n',
  },
  {
    id: 'kanban',
    name: 'Kanban',
    title: 'Mermaid Sprint Board',
    code: "---\nconfig:\n  kanban:\n    ticketBaseUrl: 'https://github.com/mermaid-js/mermaid/issues/#TICKET#'\n---\nkanban\n  todo[Todo]\n    docs[Create documentation]\n    blog[Write blog post about the new diagram]@{ priority: 'Low' }\n  inProgress[In progress]\n    renderer[Improve renderer for edge cases]@{ assigned: 'knsv', priority: 'High' }\n  readyForTest[Ready for test]\n    parserTests[Create parsing tests]@{ ticket: 2038, assigned: 'K.Sveidqvist', priority: 'High' }\n  done[Done]\n    grammar[Design grammar]@{ assigned: 'knsv' }\n    longTitle[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: 2036, priority: 'Very High' }\n    dbFunction[Update DB function]@{ ticket: 2037, assigned: 'knsv', priority: 'High' }\n",
  },
  {
    id: 'packet',
    name: 'Packet',
    title: 'TCP Packet',
    code: '---\ntitle: "TCP Packet"\n---\npacket\n0-15: "Source Port"\n16-31: "Destination Port"\n32-63: "Sequence Number"\n64-95: "Acknowledgment Number"\n96-99: "Data Offset"\n100-105: "Reserved"\n106: "URG"\n107: "ACK"\n108: "PSH"\n109: "RST"\n110: "SYN"\n111: "FIN"\n112-127: "Window"\n128-143: "Checksum"\n144-159: "Urgent Pointer"\n160-191: "(Options and Padding)"\n192-255: "Data (variable length)"\n',
  },
  {
    id: 'pie',
    name: 'Pie',
    title: 'Basic Pie Chart',
    code: 'pie title Pets adopted by volunteers\n    "Dogs" : 386\n    "Cats" : 85\n    "Rats" : 15\n',
  },
  {
    id: 'quadrant',
    name: 'Quadrant',
    title: 'Product Positioning',
    code: 'quadrantChart\n    title Reach and engagement of campaigns\n    x-axis Low Reach --> High Reach\n    y-axis Low Engagement --> High Engagement\n    quadrant-1 We should expand\n    quadrant-2 Need to promote\n    quadrant-3 Re-evaluate\n    quadrant-4 May be improved\n    Campaign A: [0.3, 0.6]\n    Campaign B: [0.45, 0.23]\n    Campaign C: [0.57, 0.69]\n    Campaign D: [0.78, 0.34]\n    Campaign E: [0.40, 0.34]\n    Campaign F: [0.35, 0.78]\n',
  },
  {
    id: 'radar',
    name: 'Radar',
    title: 'Student Grades',
    code: '---\ntitle: "Grades"\n---\nradar-beta\n  axis m["Math"], s["Science"], e["English"]\n  axis h["History"], g["Geography"], a["Art"]\n  curve a["Alice"]{85, 90, 80, 70, 75, 90}\n  curve b["Bob"]{70, 75, 85, 80, 90, 85}\n\n  max 100\n  min 0\n',
  },
  {
    id: 'railroad-diagram-abnf',
    name: 'Railroad Diagram (ABNF)',
    title: 'Email Address',
    code: 'railroad-abnf-beta\n    title Email Address\n\n    address = local-part "@" domain ;\n    local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;\n    domain = label *( "." label ) ;\n    label = 1*( ALPHA / DIGIT / "-" ) ;\n',
  },
  {
    id: 'railroad-diagram-ebnf',
    name: 'Railroad Diagram (EBNF)',
    title: 'Expression Grammar',
    code: 'railroad-ebnf-beta\n    title Expression Grammar\n\n    expression = term ( "+" term | "-" term )* ;\n    term = factor ( "*" factor | "/" factor )* ;\n    factor = number | "(" expression ")" ;\n    number = digit+ ;\n    digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;\n',
  },
  {
    id: 'railroad-diagram-ir',
    name: 'Railroad Diagram (IR)',
    title: 'Expression Grammar',
    code: 'railroad-beta\n    title Expression Grammar\n\n    expression = sequence(\n        nonterminal("term"),\n        zeroOrMore(sequence(\n            choice(terminal("+"), terminal("-")),\n            nonterminal("term")\n        ))\n    ) ;\n    term = sequence(\n        nonterminal("factor"),\n        zeroOrMore(sequence(\n            choice(terminal("*"), terminal("/")),\n            nonterminal("factor")\n        ))\n    ) ;\n    factor = choice(\n        nonterminal("number"),\n        sequence(terminal("("), nonterminal("expression"), terminal(")"))\n    ) ;\n    number = oneOrMore(nonterminal("digit")) ;\n    digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;\n',
  },
  {
    id: 'railroad-diagram-peg',
    name: 'Railroad Diagram (PEG)',
    title: 'Calculator Grammar',
    code: 'railroad-peg-beta\n    title Calculator Grammar\n\n    Expression <- Term (("+" / "-") Term)* ;\n    Term <- Factor (("*" / "/") Factor)* ;\n    Factor <- Number / "(" Expression ")" ;\n    Number <- Digit+ ;\n    Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;\n',
  },
  {
    id: 'requirement',
    name: 'Requirement',
    title: 'E-Bike Braking System',
    code: 'requirementDiagram\n\n    requirement rider_safety {\n        id: 1\n        text: Riders must be able to stop safely in all conditions.\n        risk: high\n        verifymethod: test\n    }\n\n    functionalRequirement brake_response {\n        id: 1.1\n        text: Brakes engage within 100 ms of lever pull.\n        risk: medium\n        verifymethod: test\n    }\n\n    performanceRequirement stopping_distance {\n        id: 1.2\n        text: Stop from 25 km/h within 4 m on dry pavement.\n        risk: medium\n        verifymethod: demonstration\n    }\n\n    designConstraint water_resistance {\n        id: 1.3\n        text: Brake electronics must be IP67 rated.\n        risk: low\n        verifymethod: inspection\n    }\n\n    element brake_controller {\n        type: hardware\n        docRef: "specs/brake-controller"\n    }\n\n    element road_test_suite {\n        type: "test suite"\n        docRef: "qa/road-tests"\n    }\n\n    rider_safety - contains -> brake_response\n    rider_safety - contains -> stopping_distance\n    brake_response - derives -> water_resistance\n    brake_controller - satisfies -> brake_response\n    road_test_suite - verifies -> stopping_distance\n',
  },
  {
    id: 'sankey',
    name: 'Sankey',
    title: 'Monthly Budget Flow',
    code: 'sankey-beta\n\nSalary,Budget,3000\nFreelance work,Budget,1200\nBudget,Rent,1300\nBudget,Groceries,600\nBudget,Transport,250\nBudget,Fun,350\nBudget,Savings,1700\n',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    title: 'Project Timeline',
    code: 'timeline\n    title History of Social Media Platform\n    2002 : LinkedIn\n    2004 : Facebook\n         : Google\n    2005 : YouTube\n    2006 : Twitter\n',
  },
  {
    id: 'treemap',
    name: 'Treemap',
    title: 'Monthly Household Budget',
    code: '---\nconfig:\n  treemap:\n    valueFormat: \'$0,0\'\n---\ntreemap-beta\n"Monthly Budget"\n    "Housing"\n        "Rent": 1400\n        "Utilities": 220\n        "Internet": 60\n    "Food"\n        "Groceries": 480\n        "Dining out": 180\n    "Transport"\n        "Car payment": 320\n        "Fuel": 140\n    "Savings"\n        "Emergency fund": 300\n        "Retirement": 400\n',
  },
  {
    id: 'treeview',
    name: 'TreeView',
    title: 'Project File Structure',
    code: 'treeView-beta\n            my-project/\n                src/\n                    components/\n                        Button.tsx\n                        Header.tsx\n                    App.tsx\n                    index.js\n                .gitignore\n                package.json\n                README.md\n',
  },
  {
    id: 'user-journey',
    name: 'User Journey',
    title: 'My Working Day',
    code: 'journey\n    title My working day\n    section Go to work\n      Make tea: 5: Me\n      Go upstairs: 3: Me\n      Do work: 1: Me, Cat\n    section Go home\n      Go downstairs: 5: Me\n      Sit down: 5: Me\n',
  },
  {
    id: 'venn',
    name: 'Venn',
    title: 'Product Sweet Spot',
    code: 'venn-beta\n    title "Finding the Product Sweet Spot"\n    set Desirable\n    set Feasible\n    set Viable\n    union Desirable,Feasible["Worth prototyping"]\n    union Feasible,Viable["Cheap to run"]\n    union Desirable,Viable["Hard to build"]\n    union Desirable,Feasible,Viable["Sweet spot"]\n',
  },
  {
    id: 'wardley',
    name: 'Wardley',
    title: 'Tea Shop Value Chain',
    code: 'wardley-beta\ntitle Tea Shop\nsize [1100, 800]\n\nanchor Business [0.95, 0.63]\nanchor Public [0.95, 0.78]\ncomponent Cup of Tea [0.79, 0.61] label [19, -4]\ncomponent Cup [0.73, 0.78]\ncomponent Tea [0.63, 0.81]\ncomponent Hot Water [0.52, 0.80]\ncomponent Water [0.38, 0.82]\ncomponent Kettle [0.43, 0.35] label [-57, 4]\ncomponent Power [0.1, 0.7] label [-27, 20]\n\nBusiness -> Cup of Tea\nPublic -> Cup of Tea\nCup of Tea -> Cup\nCup of Tea -> Tea\nCup of Tea -> Hot Water\nHot Water -> Water\nHot Water -> Kettle\nKettle -> Power\n\nevolve Kettle 0.62\nevolve Power 0.89\n\nnote "Standardising power allows Kettles to evolve faster" [0.30, 0.49]\nnote "Hot water is obvious and well known" [0.48, 0.80]\nnote "A generic note appeared" [0.23, 0.33]\n',
  },
  {
    id: 'xy',
    name: 'XY',
    title: 'Sales Revenue',
    code: 'xychart-beta\n    title "Sales Revenue"\n    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]\n    y-axis "Revenue (in $)" 4000 --> 11000\n    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n',
  },
]
