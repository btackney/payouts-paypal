const AWS = require('aws-sdk');
const ses = new AWS.SES();
const fs = require('fs');
const s3 = new AWS.S3();
const Parse = require('parse/node');

Parse.initialize('');
Parse.serverURL = '';
Parse.masterKey = '';

exports.handler = (event, context, callback) => {
    const instructorCommissionQuery = new Parse.Query(Parse.Object.extend('InstructorCommission'));
    const lastPayoutCutoff = new Date();
    lastPayoutCutoff.setDate(lastPayoutCutoff.getDate() - 9);
    const currentPayoutCutoff = new Date();
    currentPayoutCutoff.setDate(currentPayoutCutoff.getDate() - 2);
    instructorCommissionQuery.greaterThanOrEqualTo('createdAt', lastPayoutCutoff);
    instructorCommissionQuery.lessThan('createdAt', currentPayoutCutoff);
    instructorCommissionQuery.include('instructor');
    instructorCommissionQuery.find().then(instructorCommissions => {
        
        const payoutsByInstructors = getPayouts(instructorCommissions, "instructor");
        console.log('payout data' + JSON.stringify(payoutsByInstructors));
        
        let paypalPayoutFormat = '';
        payoutsByInstructors.forEach(instructorPayout => {
            const amount = instructorPayout.amount / 100;
            paypalPayoutFormat = paypalPayoutFormat + '' + instructorPayout.paypal + ',' + amount + ',USD,' + instructorPayout.instructorId + ',' +instructorPayout.instructorCommissionIds +'\n';
        });
        
        console.log('PAYPAL FORM ' + paypalPayoutFormat);

        fs.writeFile('/tmp/payout.txt', paypalPayoutFormat, 'utf8', function (err) {
          if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
            callback(err);
          } else{
            let fileStream = fs.createReadStream("/tmp/payout.txt");
            fileStream.on('error', function(err) {
                console.log('File Error', err);
            });
            var params = {
                Bucket : 'ywctw-payouts',
                Key : Date.now()+'::instructorPayout.csv',
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
        callback('err :: ' + JSON.stringify(error));
    });
};

function getPayouts(arr, prop){
    const payouts = [];
    for (let i = 0; i < arr.length; i++) {
        console.log('arr prop ::' + arr[i].get(prop).id);
        let foundInstructor = false;
        payouts.forEach(payout => {
            if(payout.instructorId == arr[i].get(prop).id){
                payout.amount = payout.amount + arr[i].get('amount');
                payout.instructorCommissionIds = payout.instructorCommissionIds + ' :: ' + arr[i].id;
                foundInstructor = true;
            }
        });
        if(!foundInstructor){
            payouts.push({
                instructorId: arr[i].get(prop).id,
                paypal:  (arr[i].get(prop).get('paypal') || 'youremail@email.com'),
                amount: 0 + arr[i].get('amount'),
                instructorCommissionIds: ''+arr[i].id
            });
        }
    }
    return payouts;
}
