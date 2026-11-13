using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Api.Contracts.Common;

public record ReorderItemsRequest(List<Guid> OrderedIds);

