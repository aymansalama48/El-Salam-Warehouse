using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ActivateUser;
using El_Salam_Warehouse.Domain.Common.Results;
using FluentAssertions;
using Moq;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace El_Salam_Warehouse.UnitTests.Features.Accounts.AccountManagement.Commands.ActivateUser;

// اختبارات وحدة لـ ActivateUserCommandHandler
public class ActivateUserCommandHandlerTests
{
    private readonly Mock<IUserManagementService> _userServiceMock;
    private readonly ActivateUserCommandHandler _handler;

    public ActivateUserCommandHandlerTests()
    {
        _userServiceMock = new Mock<IUserManagementService>();
        _handler = new ActivateUserCommandHandler(_userServiceMock.Object);
    }

    // التحقق من نجاح التفعيل عند وجود المستخدم
    [Fact]
    public async Task Handle_WhenUserExists_ShouldReturnSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new ActivateUserCommand(userId);

        _userServiceMock
            .Setup(s => s.ActivateUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
    }

    // التحقق من الفشل عند عدم وجود المستخدم
    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldReturnFailure()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new ActivateUserCommand(userId);
        var error = new Error("Users.NotFound", "المستخدم غير موجود.", ErrorType.NotFound);

        _userServiceMock
            .Setup(s => s.ActivateUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(error));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(error);
    }
}
