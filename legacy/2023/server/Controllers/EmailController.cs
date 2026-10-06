using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SendEmailDotNetCoreWebAPI.Model;
using System;
using System.Threading.Tasks;
using SendEmailDotNetCoreWebAPI.Services;
using System.Collections.Generic;
/* comment 2*/
namespace SendEmailDotNetCoreWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController : Controller
    {
        private readonly ILogger<EmailController> _logger;
        private readonly IMailService _mailService;

        public EmailController(ILogger<EmailController> logger, IMailService mailService)
        {
            _logger = logger;
            _mailService = mailService;
        }

        [HttpPost("SendEmail")]
        public async Task<IActionResult> SendEmail([FromForm] Customer customer)
        {
            try
            {
                // Send an email with attachments to Return Done Team
                await _mailService.SendEmailAsync(customer);

                // Email to Customer
                await _mailService.SendEmailAsyncToCustomer(customer);

                return Ok(customer);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", customer.Email);
                throw;
            }
        }
    }
}
