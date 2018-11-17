# payouts-paypal-aws
Generates paypal payouts .csv file and saves in s3 based on db records, use with lambda &amp; cloud watch events scheduled expressions.

Scheduled Expression(Runs 15th of Month at 10AM): cron(0 10 15 * ? *)

Details on paypal mass payouts: https://developer.paypal.com/docs/payouts/integrate/ui-integration/ 

Parse Server (Yuck!) https://github.com/parse-community/parse-server was used for interactions with DB.

This was created for a project where i had to pay commissions to different people based on db records created at time of sale in server - AffiliateCommissions & SecondTierAffiliateCommissions. It will run through all DB records sorted by Paypal Email & Date (1+ month old) and create csv file in s3 to upload to paypal mass payouts. The project was abandonned and this code never saw real action but can be a good example/base for anyone considering paypal mass payouts. Could use some cleanup.
