# payout.js
Creates paypal payouts .csv file based on db records, saves file in s3, use with lambda &amp; cloud watch events scheduled expressions.

Scheduled Expression(Runs 15th of Month at 10AM): cron(0 10 15 * ? *)

For details on paypal mass payouts see https://developer.paypal.com/docs/payouts/integrate/ui-integration/ 

The DB ORM used for this system was ParseJS (yuck!) can be changed for any DB. 

This was created for a project where i had to pay commissions to different people based on db records created at time of sale in server - AffiliateCommissions & SecondTierAffiliateCommissions. It will run through all DB records sorted by Date (1+ month old) and create csv file in s3 to upload to paypal mass payouts. The project was abandonned and this code never saw real action but can be a good example/base for anyone considering paypal mass payouts.
