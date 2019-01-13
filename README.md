# payouts-paypal-aws
Generates paypal payouts .csv file and saves in s3 based on db records, use with lambda &amp; cloud watch events scheduled expressions

Never tested....project was abandoned but figured I'd share.

Scheduled Expression(Runs 15th of Month at 10AM): cron(0 10 15 * ? *)

Details on paypal mass payouts: https://developer.paypal.com/docs/payouts/integrate/ui-integration/ 

Parse Server https://github.com/parse-community/parse-server for DB.


