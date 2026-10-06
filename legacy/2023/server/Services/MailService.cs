using MailKit.Security;
using Microsoft.Extensions.Options;
using SendEmailDotNetCoreWebAPI.Model;
using SendEmailDotNetCoreWebAPI.Settings;
using System.IO;
using System.Net;
using MailKit.Net.Smtp;
using System.Threading.Tasks;
using MimeKit;
using System;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using System.Collections.Generic;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace SendEmailDotNetCoreWebAPI.Services
{
    public class MailService : IMailService
    {
        private readonly MailSettings _mailSettings;
        private string _messageBody;
        private string _messageBody1;
        private string _messageBody2;
        private string _storeDetails;

        public MailService(IOptions<MailSettings> mailSettings)
        {
            _mailSettings = mailSettings.Value;
        }

        //Email to us
        public async Task SendEmailAsync(Customer customer)
        {
            var email = new MimeMessage();

            email.From.Add(new MailboxAddress("Return Done", _mailSettings.Mail));
            email.To.Add(MailboxAddress.Parse("support@returndone.com"));
            email.Subject = "New Order Placed - " + customer.Code;

            DateTime earliestDate = DateTime.MinValue;
            if (customer.StoreNames != null && customer.StoreNames.Count != 0 && customer.StoreNames.Count != 1)
            {
                foreach (var store in customer.StoreNames)
                {
                    if (store.StoreDeadlineDate != null) { 
                        earliestDate = DateTime.Parse(customer.StoreNames[0].StoreDeadlineDate).Date;}
                }
            }

            if (customer.StoreNames != null && customer.StoreNames.Count != 0 && customer.StoreNames.Count != 1)
            {
                foreach (var store in customer.StoreNames)
                {
                    if (store.StoreDeadlineDate != null)
                    if(DateTime.Parse(store.StoreDeadlineDate).Date < earliestDate.Date)
                    {
                        earliestDate = DateTime.Parse(store.StoreDeadlineDate).Date;
                    }
                }
                if (earliestDate != DateTime.MinValue)
                    customer.DeadlineDate = earliestDate.Date.ToString();
                else
                    customer.DeadlineDate = "".ToString();
            }

            var builder = new BodyBuilder();

            // Create the message body
            _messageBody = "<p>Request ID: " + customer.Code + "</p>" +
                     "<p>First Name: " + customer.FirstName + "</p>" +
                     "<p>Last Name: " + customer.LastName + "</p>" +
                     "<p>Email: " + customer.Email + "</p>" +
                     "<p>Phone Number: " + customer.PhoneNumber + "</p>" +
                     "<p>Address Line1: " + customer.AddressLine1 + "</p>" +
                     "<p>Address Line2: " + customer.AddressLine2 + "</p>" +
                     "<p>City: " + customer.City + "</p>" +
                     "<p>State: " + customer.State + "</p>" +
                     "<p>Zip Code: " + customer.Zip + "</p>" +
                     "<p>Return Deadline Date: " + customer.DeadlineDate + "</p>" +
                     "<p>Pickup Date: " + customer.PickupDate + "</p>" +
                     "<p>Pickup Time Slot: " + customer.TimeSlot + "</p>" +
                     "<p>How did you hear about us: " + customer.Reference + "</p>";

            // Add the list of stores to the message body
            _messageBody += "<b>Store and Item Details\n</b>";
            if (customer.StoreNames != null && customer.StoreNames.Count != 0)
                foreach (var store in customer.StoreNames)
            {
                    _messageBody += "<p>Store Name: " + store.Name + "</p>" +
                         "<p>Store Type: " + store.StoreType + "</p>" +
                         "<p>Number of items: " + store.Item + "</p>";

                    if (!string.IsNullOrEmpty(store.StoreDeadlineDate)) {
                        _messageBody += "<p>Store Deadline Date: " + store.StoreDeadlineDate + "</p>";
                    }
                    else {
                        _messageBody += "<p>Store Deadline Date: Deadline Date is Empty! </p>";
                    }

            }

            _messageBody1 = "<table style='border-collapse: collapse;'>";

            // Add the column names as the header row
            _messageBody1 += "<tr>";
            _messageBody1 += "<th style='border: 1px solid black;'>Timestamp</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Request ID</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Email Address</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>First Name</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Last Name</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Phone Number</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>How did you hear about us?</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Address Line 1</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Address Line 2</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>City</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>State</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Zip Code</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Store Name and Items</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Upload all receipts and return labels</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Pickup Date</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Pickup Time Slot</th>";
            _messageBody1 += "<th style='border: 1px solid black;'>Return Deadline Date</th>";
            _messageBody1 += "</tr>";

            // Add the data rows
            foreach (var store in customer.StoreNames)
            {
                _messageBody1 += "<tr>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + DateTimeOffset.Now + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.Code + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.Email + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.FirstName + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.LastName + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.PhoneNumber + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.Reference + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.AddressLine1 + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.AddressLine2 + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.City + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.State + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.Zip + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + store.Name + " - " + store.Item + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + "" + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.PickupDate + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.TimeSlot + "</td>";
                _messageBody1 += "<td style='border: 1px solid black;'>" + customer.DeadlineDate + "</td>";
                _messageBody1 += "</tr>";
            }
            _messageBody1 += "</table>";

            _messageBody += "\n";

            _messageBody1 += "\n";
            builder.HtmlBody = _messageBody + _messageBody1;
          

            //Attach files from each store

            byte[] fileBytes;
           if (customer.Receipt != null)
                foreach (var file in customer.Receipt)
                {
                    if (file.Length > 0)
                    {
                        using (var ms = new MemoryStream())
                        {
                            file.CopyTo(ms);
                            fileBytes = ms.ToArray();
                        }
                        builder.Attachments.Add(file.FileName, fileBytes, ContentType.Parse(file.ContentType));
                    }
                }
            email.Body = builder.ToMessageBody();
            try
            {
                using var smtp = new MailKit.Net.Smtp.SmtpClient();
                smtp.Connect(_mailSettings.Host, _mailSettings.Port, SecureSocketOptions.StartTls);
                smtp.Authenticate(_mailSettings.Mail, _mailSettings.Password);
                await smtp.SendAsync(email);
                smtp.Disconnect(true);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //Email to customer
        public async Task SendEmailAsyncToCustomer(Customer customer)
        {
            var email = new MimeMessage();

             email.From.Add(new MailboxAddress("Return Done", _mailSettings.Mail));
             email.To.Add(MailboxAddress.Parse(customer.Email));
             email.Subject = "Your Return Done Pickup Request Confirmation - " + customer.Code;
             var builder = new BodyBuilder();

             // Create the message body
             if (customer.StoreNames != null && customer.StoreNames.Count != 0)
                 foreach (var store in customer.StoreNames)
                 {
                     if (store.Item !=1 ) 
                         _storeDetails +=  store.Name + " - " + store.Item + " items<br>";
                     else if (store.Item == 1)
                         _storeDetails += store.Name + " - " + store.Item + " item<br>";
                 }

            _messageBody = "<p>Dear " + customer.FirstName + ",</p>" +
                "<p>We are pleased to inform you that your Return Done pickup request has been confirmed.</br></p>" +
                "<p><b> Request ID: </b>" + customer.Code +
                "<p><b>Pickup Details</b>" +
                "<br>Pickup Address: " + customer.AddressLine1;
                if (!string.IsNullOrEmpty(customer.AddressLine2))
                {
                    _messageBody += ", " + customer.AddressLine2;
                }

            _messageBody += ", " + customer.City + ", " + customer.State + ", "+ customer.Zip + 
                 "<br>Pickup Date: " + customer.PickupDate +
                 "<br>Pickup Time Slot: " + customer.TimeSlot + "</p>" +
                 "<p><b>Item Details</b><br>" + _storeDetails + "</p>" +

                 "<p>You <b>must be present</b> physically at the time of pickup so that our pickup specialist can verify the items you are requesting to return.</br></p>" +
                 "<p>If you have not provided a return deadline date or uploaded your return labels through our Return Initiation Form, please send them to us by either emailing support@returndone.com along with your <b>request ID</b> or simply replying to this email. Please ensure that you send all the required information at least 2 hours before the start of your pickup time slot.</p>" +
                 "<p>If you need to make changes to your chosen pickup slot, we are happy to assist you. To cancel or reschedule your pickup, please send an email to support@returndone.com with your <b>request ID</b> and desired changes.</p>" +
                 "<p>Please note that you may cancel or reschedule your pickup up to 2 hours before the start of your scheduled pickup slot, and reschedule for any slot on the following day or later. Our team will do its best to accommodate your request and provide you with updated pickup details.</br></p>" +
                 "<p>If you have any questions or concerns, please don't hesitate to contact us. We're always happy to help.</br></p>" +
                 "<p>Best regards,<br>Return Done Team</p>";


             builder.HtmlBody = _messageBody;

             byte[] fileBytes;
             if (customer.Receipt != null)
                 foreach (var file in customer.Receipt)
                 {
                     if (file.Length > 0)
                     {
                         using (var ms = new MemoryStream())
                         {
                             file.CopyTo(ms);
                             fileBytes = ms.ToArray();
                         }
                         builder.Attachments.Add(file.FileName, fileBytes, ContentType.Parse(file.ContentType));
                     }
                 }

             email.Body = builder.ToMessageBody();
            var result = "";
           
            try
             {
                    using var smtp = new MailKit.Net.Smtp.SmtpClient();
                    smtp.Connect(_mailSettings.Host, _mailSettings.Port, SecureSocketOptions.StartTls);
                    smtp.Authenticate(_mailSettings.Mail, _mailSettings.Password);
                    await smtp.SendAsync(email);
                    smtp.Disconnect(true);
                    result = "Customer Email Successfully Sent";
             }
             catch (Exception ex)
             {
                throw ex;
             }
            finally
            {
                var emailTOUS = new MimeMessage();
                emailTOUS.From.Add(new MailboxAddress("Return Done", _mailSettings.Mail));
                emailTOUS.To.Add(MailboxAddress.Parse("support@returndone.com"));
                emailTOUS.Subject = result;

                var builder2 = new BodyBuilder();
                _messageBody2 = "<p>" + result + "</p>" +
                                "<br><p>Customer Email: " + customer.Email + "</p></br>";

                builder.HtmlBody = _messageBody2;
                emailTOUS.Body = builder.ToMessageBody();

                using var smtp1 = new MailKit.Net.Smtp.SmtpClient();
                smtp1.Connect(_mailSettings.Host, _mailSettings.Port, SecureSocketOptions.StartTls);
                smtp1.Authenticate(_mailSettings.Mail, _mailSettings.Password);
                await smtp1.SendAsync(emailTOUS);
                smtp1.Disconnect(true);

            }
        }

        public string GetMessageBody()
        {
            return _messageBody;
        }
    }
}
