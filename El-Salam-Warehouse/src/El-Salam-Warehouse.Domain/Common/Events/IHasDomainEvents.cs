using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Domain.Common.Events
{
    // "عقد": أي كلاس عايز يخزن أخبار، لازم يقدر يعمل الحاجتين دول
    public interface IHasDomainEvents
    {
        IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
        void ClearDomainEvents();
    }
}
