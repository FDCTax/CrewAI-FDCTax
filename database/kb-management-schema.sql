-- ==========================================
-- KNOWLEDGE BASE MANAGEMENT - SANDBOX
-- CRITICAL: Deploy Today
-- ==========================================

-- Drop existing if needed and recreate with proper structure
DROP TABLE IF EXISTS kb_entries CASCADE;

CREATE TABLE kb_entries (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tags TEXT,
    variations TEXT,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_entries_title ON kb_entries(title);
CREATE INDEX IF NOT EXISTS idx_kb_entries_tags ON kb_entries USING gin(to_tsvector('english', tags));

-- ==========================================
-- POPULATE WITH SAMPLE KB CONTENT
-- ==========================================

INSERT INTO kb_entries (title, tags, variations, answer) VALUES
(
    'Claiming Toy and Play Equipment Expenses',
    'toys, play equipment, deductions, expenses',
    'toys, toy expenses, play equipment, educational toys, can I claim toys, deducting toys',
    '<h2>Claiming Toy and Play Equipment Expenses</h2>
<p>As a Family Day Care educator, you can claim toy and play equipment expenses used in your FDC business.</p>

<h3>What You Can Claim:</h3>
<ul>
    <li><strong>Educational toys</strong> - puzzles, blocks, learning games</li>
    <li><strong>Outdoor equipment</strong> - slides, swings, trampolines</li>
    <li><strong>Arts and crafts supplies</strong> - paper, crayons, paint</li>
    <li><strong>Books and learning materials</strong></li>
</ul>

<h3>FDC Percentage:</h3>
<p>Multiply the cost by your FDC percentage (typically 80-90%). For example, if a toy costs $100 and your FDC% is 85%, you can claim $85.</p>

<h3>Record Keeping:</h3>
<ul>
    <li>Keep all receipts</li>
    <li>Note the date of purchase</li>
    <li>Document how the item is used in your FDC business</li>
</ul>

<p><strong>Note:</strong> For items over $300, depreciation rules may apply. Contact the FDC Tax team for specific advice.</p>'
),
(
    'Food Expenses for FDC',
    'food, groceries, meals, snacks, deductions',
    'food expenses, groceries, meals, snacks, can I claim food, food deduction',
    '<h2>Food Expenses for Family Day Care</h2>
<p>Food provided to children in your care is a legitimate FDC business expense.</p>

<h3>What You Can Claim:</h3>
<ul>
    <li>Breakfast, lunch, and snacks provided to FDC children</li>
    <li>Special dietary requirements (gluten-free, dairy-free)</li>
    <li>Cooking ingredients used for FDC meals</li>
</ul>

<h3>Calculating Your Claim:</h3>
<p>There are two methods:</p>
<ol>
    <li><strong>Actual Method:</strong> Keep receipts and apply your FDC percentage</li>
    <li><strong>Standard Rate:</strong> Claim a standard rate per child per day (check current ATO rates)</li>
</ol>

<h3>Record Keeping:</h3>
<ul>
    <li>Keep grocery receipts</li>
    <li>Maintain a meal diary showing what was served</li>
    <li>Record attendance (children present on each day)</li>
</ul>

<p><strong>Tip:</strong> Separate family groceries from FDC food where possible to make claims easier.</p>'
),
(
    'Vehicle and Mileage Claims',
    'vehicle, mileage, car expenses, transport, deductions',
    'vehicle expenses, mileage, car claims, driving, transport, can I claim mileage',
    '<h2>Vehicle and Mileage Claims for FDC Educators</h2>
<p>You can claim vehicle expenses for FDC-related trips.</p>

<h3>Eligible Trips:</h3>
<ul>
    <li>Transporting children to/from activities</li>
    <li>Educational excursions</li>
    <li>Shopping for FDC supplies</li>
    <li>Attending FDC training or meetings</li>
    <li>Dropping children at school/preschool as part of care</li>
</ul>

<h3>Two Methods:</h3>
<ol>
    <li><strong>Cents per Kilometer:</strong> Claim up to 5,000 km at the ATO rate (currently 85 cents/km for 2024-25)
        <ul><li>No receipts needed</li><li>Must keep a logbook of trips</li></ul>
    </li>
    <li><strong>Logbook Method:</strong> Keep a 12-week logbook
        <ul><li>Claim actual costs × business use %</li><li>Includes fuel, insurance, registration, maintenance</li></ul>
    </li>
</ol>

<h3>Not Claimable:</h3>
<ul>
    <li>Personal trips</li>
    <li>Commuting between home and another workplace</li>
</ul>

<p><strong>Important:</strong> Keep a detailed logbook with date, destination, purpose, and kilometers for all FDC trips.</p>'
),
(
    'GST Registration for FDC Educators',
    'gst, registration, threshold, tax',
    'gst registration, should I register for gst, gst threshold, do I need gst',
    '<h2>GST Registration for FDC Educators</h2>
<p>GST (Goods and Services Tax) registration depends on your turnover.</p>

<h3>Do You Need to Register?</h3>
<ul>
    <li><strong>Mandatory:</strong> If your annual turnover is $75,000 or more</li>
    <li><strong>Optional:</strong> If your turnover is below $75,000</li>
</ul>

<h3>Benefits of Registering:</h3>
<ul>
    <li>Claim GST credits on business purchases</li>
    <li>Looks more professional to some families</li>
    <li>May be required by some councils or schemes</li>
</ul>

<h3>Responsibilities:</h3>
<ul>
    <li>Lodge BAS (Business Activity Statement) quarterly</li>
    <li>Charge GST on your services (included in fees)</li>
    <li>Keep detailed GST records</li>
</ul>

<h3>Turnover Calculation:</h3>
<p>Add up all your FDC income for the year. Include:</p>
<ul>
    <li>Fees from families</li>
    <li>CCS payments</li>
    <li>Any other FDC-related income</li>
</ul>

<p><strong>Need help?</strong> The FDC Tax team can assess your situation and help with GST registration if needed.</p>'
),
(
    'BAS Lodgement for GST-Registered Educators',
    'bas, lodgement, gst, quarterly, tax',
    'bas, business activity statement, when is bas due, bas lodgement, quarterly bas',
    '<h2>BAS Lodgement for GST-Registered FDC Educators</h2>
<p>If you are registered for GST, you must lodge a Business Activity Statement (BAS) quarterly.</p>

<h3>BAS Due Dates (Quarterly):</h3>
<ul>
    <li><strong>Quarter 1:</strong> July-September → Due 28 October</li>
    <li><strong>Quarter 2:</strong> October-December → Due 28 February</li>
    <li><strong>Quarter 3:</strong> January-March → Due 28 April</li>
    <li><strong>Quarter 4:</strong> April-June → Due 28 July</li>
</ul>

<h3>What Goes in a BAS:</h3>
<ul>
    <li>GST collected from families (GST on income)</li>
    <li>GST paid on business purchases (GST credits)</li>
    <li>PAYG instalments (if applicable)</li>
</ul>

<h3>Record Keeping:</h3>
<ul>
    <li>Keep all tax invoices for purchases</li>
    <li>Track income and GST charged</li>
    <li>Reconcile accounts at end of each quarter</li>
</ul>

<h3>FDC Tax Help:</h3>
<p>Our team can prepare and lodge your BAS for you. We will:</p>
<ul>
    <li>Calculate your GST liability</li>
    <li>Claim all eligible GST credits</li>
    <li>Lodge on time to avoid penalties</li>
    <li>Provide a summary of your position</li>
</ul>

<p><strong>Tip:</strong> Set quarterly reminders and keep records up-to-date throughout the quarter.</p>'
),
(
    'Rent and Mortgage Interest Claims',
    'rent, mortgage, home expenses, occupancy',
    'rent claim, mortgage interest, can I claim rent, home office, occupancy expenses',
    '<h2>Rent and Mortgage Interest Claims</h2>
<p>FDC educators can claim a portion of rent or mortgage interest based on business use of the home.</p>

<h3>What You Can Claim:</h3>
<ul>
    <li><strong>Rent:</strong> Portion of rent × FDC percentage × hours of care</li>
    <li><strong>Mortgage Interest:</strong> Interest portion only (not principal repayments)</li>
</ul>

<h3>Calculating Your Claim:</h3>
<p>Use the FDC percentage method:</p>
<ol>
    <li>Calculate space used for FDC (e.g., 60% of home)</li>
    <li>Calculate time used for FDC (e.g., 50 hours/week ÷ 168 hours = 30%)</li>
    <li>FDC % = Space % × Time % = 60% × 30% = 18%</li>
    <li>Claim: Annual rent/interest × 18%</li>
</ol>

<h3>Example:</h3>
<p>If your annual rent is $20,000 and your FDC% is 18%, you can claim $3,600.</p>

<h3>Record Keeping:</h3>
<ul>
    <li>Keep rental agreements or mortgage statements</li>
    <li>Document hours of care provided</li>
    <li>Keep a floor plan showing FDC space</li>
</ul>

<p><strong>Note:</strong> This is a complex area. The FDC Tax team can help calculate your exact entitlement.</p>'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ KB Management Schema applied!';
    RAISE NOTICE '✅ Created kb_entries table';
    RAISE NOTICE '✅ Inserted 6 sample KB entries';
END $$;
