Ok, time to get into the rough patch of work - Budget

/Users/vishaljassal/Desktop/events/app/budget

Revamp the layout and page look of this entire thing. It's ugly and does not fit what we're looking for. It needs to look like a simplied Accounting/Bookkeeping like tool that will help control and see Budgets.

Remember, this is the table for Budgets:
Budget Table
- Purchase
- Vendor (will link back to Vendor table when I work on the Vendor section/page)
- Date
- Link to Sub-Event or Event (should be tied to the Events/Sub-Events table)
- Category
- Cost
- Payments (linked to Logged Payments - see below; will show list of payments made in Logged Payment)
- Tags
- Payment For
- Payment By
- Remaining

Logged Payments Table - (link to parent Budget table; shows logs of payment in Payments)
- Purchase (link to the Purchase data input in Budget table; should be a dropdown selectable to select which purchase should be logged under)
- Payment Amount
- Payment By
- Payment For
- Payment Date
- Item

Logged Item Costs Table - (link to table to Logged Payments Table)
- Item (links back to Item in Logged Payments Table)
- Per Cost
- Subtotal
- Total

Note: payment logging IS NOT REQUIRED, but option to log payments. So if the Budget table is (or input) is the only place they want to track payment or input it there, that should be doable. 

Now, this is a lot of information and I want this page made very clean, covering the entire length of the page and detailed but simple. You can use any app as an example to create this page, but make sure it is professional and clean. I will have to make changes at somepoint to ensure it connects to other pieces of the application. Take your time building this and use common logic and work on potential flaws you find in my process. 

Be slow with this build to ensure it is capable with today's standards. Be slow and efficient.