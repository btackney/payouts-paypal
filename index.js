const AWS = require('aws-sdk');
const ses = new AWS.SES();
const fs = require('fs');
const s3 = new AWS.S3();
const Parse = require('parse/node');

Parse.initialize('');
Parse.serverURL = '';
Parse.masterKey = '';

exports.handler = (event, context, callback) => {
    const affiliateCommissionQuery = new Parse.Query(Parse.Object.extend('AffiliateCommission'));
    const secondTierAffiliateCommissionQuery = new Parse.Query(Parse.Object.extend('SecondTierAffiliateCommission'));
    
    const lastPayoutCutoff = new Date();
    lastPayoutCutoff.setDate(lastPayoutCutoff.getDate() - 60);
    const currentPayoutCutoff = new Date();
    currentPayoutCutoff.setDate(currentPayoutCutoff.getDate() - 30);
    affiliateCommissionQuery.greaterThanOrEqualTo('createdAt', lastPayoutCutoff);
    affiliateCommissionQuery.lessThan('createdAt', currentPayoutCutoff);
    affiliateCommissionQuery.include('instructor');
    affiliateCommissionQuery.include('ambassador');
    
    secondTierAffiliateCommissionQuery.greaterThanOrEqualTo('createdAt', lastPayoutCutoff);
    secondTierAffiliateCommissionQuery.lessThan('createdAt', currentPayoutCutoff);
    secondTierAffiliateCommissionQuery.include('instructor');
    secondTierAffiliateCommissionQuery.include('ambassador');
    
    
    affiliateCommissionQuery.find().then(affiliateCommissions => {
        secondTierAffiliateCommissionQuery.find().then(secondTierCommissions => {
            const allAffiliateCommissions = affiliateCommissions.concat(secondTierCommissions);
            const payoutsByAffiliates = getPayouts(allAffiliateCommissions);

            let paypalPayoutFormat = '';
            payoutsByAffiliates.forEach(payout => {
                let userInfo = '';
                if(payout.instructorId){ userInfo = 'instructor::' + payout.instructorId; }
                if(payout.ambassadorId){ userInfo = 'ambassador::' + payout.ambassadorId; }
                const amount = payout.amount / 100;
                paypalPayoutFormat = paypalPayoutFormat + '' + payout.paypal + ',' + amount + ',USD,' + userInfo + ',' + payout.affiliateCommissionIds +'\n';
            });
            
            console.log('PAYPAL FORM ' + paypalPayoutFormat);
    
            fs.writeFile('/tmp/payout.txt', paypalPayoutFormat, 'utf8', function (err) {
              if (err) {
                console.log('Some error occured - file either not saved or corrupted file saved.');
                callback(err);
              } else {
                let fileStream = fs.createReadStream("/tmp/payout.txt");
                fileStream.on('error', function(err) {
                    console.log('File Error', err);
                });
                var params = { 
                    Bucket : 'ywctw-payouts',
                    Key : Date.now()+'::affiliatePayout.csv',
                    Body : fileStream
                };
                s3.putObject(params, function(err, data) {
                    if (err) console.log('write err', err, err.stack);
                    else  {
                        console.log('s3 upload response' + JSON.stringify(data));
                        const response = {
                            statusCode: 200,
                            body: paypalPayoutFormat
                        };
                        callback(null, response);
                    }
                });
              }
            });
            }, error => {
                callback('error :: ' + JSON.stringify(error));
            });
        }, err => {
            callback('err ::' + JSON.stringify(err));
        }
    );
};

function getPayouts(arr){
    const payouts = [];
    for (let i = 0; i < arr.length; i++) {
        let foundAffiliate = false;
        payouts.forEach(payout => {
            const payoutPaypal = arr[i].get('instructor') ? arr[i].get('instructor').get('paypal') : arr[i].get('ambassador').get('paypal');
            if(payout.paypal == payoutPaypal){
                payout.amount = payout.amount + arr[i].get('amount');
                payout.affiliateCommissionIds = payout.affiliateCommissionIds + ' :: ' + arr[i].id;
                foundAffiliate = true;
            }
        });
        if(!foundAffiliate){
            if(arr[i].get('instructor')){
                payouts.push({
                    instructorId: arr[i].get('instructor').id,
                    paypal:  (arr[i].get('instructor').get('paypal') || 'email@youremail.com'),
                    amount: 0 + arr[i].get('amount'),
                    affiliateCommissionIds: ''+arr[i].id
                });
            }
            if(arr[i].get('ambassador')){
                payouts.push({
                    ambassadorId: arr[i].get('ambassador').id,
                    paypal:  (arr[i].get('ambassador').get('paypal') || 'email@youremail.com'),
                    amount: 0 + arr[i].get('amount'),
                    affiliateCommissionIds: ''+arr[i].id
                });
            }

        }
    }
    return payouts;
}
