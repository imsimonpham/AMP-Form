<script language='javascript' runat='server'>
  Platform.Load('Core', '1.1.5');
  // Arrays of allowed values for both Sender Address and Sender Origin
  // Sender Address is the from address when you send an email, make sure your expected from address is included in the list
  // Sender Origin represents the domain originating the request
  // The Marketing Cloud origin is in place to allow testing in Subscriber Preview, update that value to match your stack
  var isAllowed = {
    senderAddress: [
      'amp@gmail.dev',
      'AMPInternalPilot@salesforce.com'
    ],
    senderOrigin: [
      'https://playground.amp.dev',
      'https://amp.gmail.dev',
      'https://mail.google.com',
      'https://user-content.s10.sfmc-content.com' // update to SFMC stack
    ]
  }

  // Getting headers from the request made to the Code Resource
  var emailSender = Platform.Request.GetRequestHeader('AMP-Email-Sender')
  var emailOrigin = Platform.Request.GetRequestHeader('Origin')
  var sourceOrigin = Platform.Request.GetQueryStringParameter('__amp_source_origin');

  //Helper function to check arrays
  Array.includes = function (req, arr) {
    for (i = 0; i < arr.length; i++) {
      if (!ret || ret == false) {
        ret = req.toUpperCase() == arr[i].toUpperCase() ? true : false;
      }
    }
    return ret;
  }

  // Check the email sender and origin from the request against the allowed values in `isAllowed`
  // If anything fails, an error is raised and the request returns no data
  if (emailSender) {
    if (Array.includes(emailSender, isAllowed.senderAddress)) {
      HTTPHeader.SetValue('AMP-Email-Allow-Sender', emailSender)
    } else {
      Platform.Function.RaiseError('Sender Not Allowed', true, 'statusCode', '3');
    }
  } else if (emailOrigin) {
    if (Array.includes(emailOrigin, isAllowed.senderOrigin)) {
      if (sourceOrigin) {
        HTTPHeader.SetValue('Access-Control-Allow-Origin', emailOrigin);
        HTTPHeader.SetValue('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
        HTTPHeader.SetValue('AMP-Access-Control-Allow-Source-Origin', sourceOrigin);
        // added for testing in certain environments
        HTTPHeader.SetValue('Access-Control-Allow-Credentials', 'true');
      }
    } else {
      Platform.Function.RaiseError('Origin Not Allowed', true, 'statusCode', '3');
    }
  } else {
    // If neither header is present raise an error and return no data
    Platform.Function.RaiseError('Origin and Sender Not Present', true, 'statusCode', '3');
  }

  if (Platform.Request.Method == 'POST') {
    // amp-form xhr request
    var email = Platform.Request.GetFormField('email');
    var answer_1 = Platform.Request.GetFormField('answer_1');
    var answer_2 = Platform.Request.GetFormField('answer_2');
    var answer_3 = Platform.Request.GetFormField('answer_3');
    var answer_4 = Platform.Request.GetFormField('answer_4');
    var DE = DataExtension.Init('Health_Survey_Data');
    var rows = Platform.Function.LookupRows('Health_Survey_Data', ['Email'], [email]);

    if (rows.length > 0) {
      // Update an existing record
      var addRow = DE.Rows.Update(
        {
          Answer_1: answer_1,
          Answer_2: answer_2,
          Answer_3: answer_3,
          Answer_4: answer_4
        },
        ['Email'], 
        [email]
      )
      if (addRow > 0) {
        var resp = { success: true }
        Write(Stringify(resp))
      } else {
        Platform.Function.RaiseError('Failed to update the record', true, 'statusCode', '3');
      }
    }
    else {
      // Create a new record
      var obj = {
        Email: email,
        Answer_1: answer_1,
        Answer_2: answer_2,
        Answer_3: answer_3,
        Answer_4: answer_4
      }
      var addRow = DE.Rows.Add(obj)
      if (addRow > 0) {
        var resp = { success: true }
        Write(Stringify(resp))
      } else {
        Platform.Function.RaiseError('Failed to create a new record', true, 'statusCode', '3');
      }
    }
  }
}
</script>
