using Microsoft.AspNetCore.Http;
using Microsoft.VisualBasic.FileIO;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Xml.Linq;

namespace SendEmailDotNetCoreWebAPI.Model
{
    public class Customer
    {
        public string TimeSlot { get; set; }
        public string PickupDate { get; set; }
        public string DeadlineDate { get; set; }
        public string Reference { get; set; }
        public List<Store> StoreNames { get; set; }
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string Code { get; set; }
        public ICollection<IFormFile> Receipt { get; set; }
    }

    public class Store
    {
        public int Item { get; set; }
        public string StoreType { get; set; }
        public string Name { get; set; }
        public string StoreDeadlineDate { get; set; }
    }

}

